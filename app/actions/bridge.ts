'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentContext } from './tenant-context';
import { recordMovement } from './wms';
import { getProducts, saveProduct } from './inventory';
import { getAuthenticatedClient } from './auth-helper';


interface TradeAction {
    type: 'sale' | 'purchase';
    contactId?: string; // Made optional
    employeeId?: string; // Added for personnel
    warehouseId?: string;
    locationId?: string;
    items: {
        productId: string;
        quantity: number;
        price: number; // Unit price
        sku: string;
        title: string;
    }[];
    total: number;
    currency: string;
    description?: string;
    paymentMethod?: 'eft' | 'cash' | 'credit_card' | 'check';
    paymentAccountId?: string;
    checkDetails?: {
        dueDate: string;
        serialNumber?: string;
        bankName?: string;
    };
    status?: 'pending' | 'completed' | 'delivered';
}

function debugLog(msg: string) {
    try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(process.cwd(), 'bridge_debug.log');
        fs.appendFileSync(logPath, new Date().toISOString() + ': ' + msg + '\n');
    } catch (e) {
        // ignore
    }
}

export async function processTradeAction(action: TradeAction): Promise<{ success: true, orderId: string } | { success: false, error: string }> {
    try {
        debugLog(`START: type=${action.type} empId=${action.employeeId}`);
        const { supabase, tenant, user } = await getAuthenticatedClient();

        if (!action.contactId && !action.employeeId) {
            throw new Error('Cari veya Personel seçimi yapılmalıdır.');
        }

        // 1. Resolve Warehouse/Location Fallback (Must happen before order creation for FK integrity)
        let activeWarehouseId = action.warehouseId;
        let activeLocationId = action.locationId;

        if (!activeWarehouseId || !activeLocationId) {
            // First try to find any existing location
            let { data: defaultLoc } = await supabase
                .from('warehouse_locations')
                .select('id, pool_id')
                .eq('tenant_id', tenant.id)
                .limit(1)
                .maybeSingle();

            if (!defaultLoc) {
                // No locations? Check for any pool
                const { data: pool } = await supabase
                    .from('inventory_pools')
                    .select('id')
                    .eq('tenant_id', tenant.id)
                    .limit(1)
                    .maybeSingle();

                let poolId = pool?.id;

                // No pool? Create a default one
                if (!poolId) {
                    const { data: newPool, error: poolError } = await supabase
                        .from('inventory_pools')
                        .insert({ tenant_id: tenant.id, key: 'MAĞAZA', name: 'Ana Mağaza Depo' })
                        .select('id')
                        .single();

                    if (poolError || !newPool) throw new Error('Varsayılan depo oluşturulamadı: ' + poolError?.message);
                    poolId = newPool.id;
                }

                // Create a default location for the pool
                const { data: newLoc, error: locError } = await supabase
                    .from('warehouse_locations')
                    .insert({ tenant_id: tenant.id, pool_id: poolId, name: 'Genel' })
                    .select('id, pool_id')
                    .single();

                if (locError || !newLoc) throw new Error('Varsayılan depo konumu oluşturulamadı: ' + locError?.message);
                defaultLoc = newLoc;
            }

            if (defaultLoc) {
                activeWarehouseId = defaultLoc.pool_id;
                activeLocationId = defaultLoc.id;
            }
        }

        // 2. Create the Order
        debugLog('Creating Order...');
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                tenant_id: tenant.id,
                contact_id: action.contactId || null,
                employee_id: action.employeeId || null,
                type: action.type,
                warehouse_id: activeWarehouseId,
                status: action.status || (action.type === 'sale' ? 'pending' : 'completed'),
                currency: action.currency,
                total: action.total,
                description: action.description,
                lines: action.items,
                payment_method: action.paymentMethod,
                payment_status: action.paymentMethod && action.paymentMethod !== 'eft' ? 'paid' : 'pending',
                paid_amount: action.paymentMethod && action.paymentMethod !== 'eft' ? action.total : 0
            })
            .select()
            .single();

        if (orderError) throw orderError;
        debugLog(`Order Created: ${order.id}`);

        // 2a. Account Resolution & Creation
        // Sale = Debit (Customer owes us), Purchase = Credit (We owe supplier)
        const accountType = action.type === 'sale' ? 'debit' : 'credit';

        let accountQuery = supabase
            .from('accounts')
            .select('id, name')
            .eq('tenant_id', tenant.id);

        let entityName = 'Bilinmeyen Cari';

        if (action.contactId) {
            accountQuery = accountQuery.eq('contact_id', action.contactId);
        } else if (action.employeeId) {
            accountQuery = accountQuery.eq('employee_id', action.employeeId);
        }

        let { data: account } = await accountQuery.maybeSingle();
        debugLog(`Account Found: ${account?.id}`);

        if (!account) {
            debugLog('Auto-creating Account...');
            // Auto-create account if missing
            if (action.contactId) {
                const { data: contact } = await supabase.from('contacts').select('company_name, first_name, last_name, type').eq('id', action.contactId).single();
                entityName = contact ? (contact.company_name || `${contact.first_name} ${contact.last_name}`) : 'Cari';
                const prefix = contact?.type === 'supplier' ? '320' : '120';

                // Generate next code
                const { count } = await supabase.from('accounts').select('*', { count: 'exact', head: true }).like('code', `${prefix}.%`).eq('tenant_id', tenant.id);
                const nextCode = `${prefix}.01.${String((count || 0) + 1).padStart(3, '0')}`;

                const { data: newAcc, error: createError } = await supabase
                    .from('accounts')
                    .insert({
                        tenant_id: tenant.id,
                        contact_id: action.contactId,
                        name: entityName,
                        code: nextCode,
                        type: contact?.type === 'supplier' ? 'supplier' : 'customer',
                        currency: 'TRY'
                    })
                    .select('id, name')
                    .single();

                if (createError) throw new Error('Cari hesap oluşturulamadı: ' + createError.message);
                account = newAcc;
            } else if (action.employeeId) {
                const { data: emp, error: empError } = await supabase.from('employees').select('first_name, last_name').eq('id', action.employeeId).single();
                if (empError) debugLog(`Emp Fetch Error: ${empError.message}`);

                entityName = emp ? `${emp.first_name} ${emp.last_name}` : 'Personel';
                const prefix = '335'; // Personnel Payables

                // Generate next code
                const { count } = await supabase.from('accounts').select('*', { count: 'exact', head: true }).like('code', `${prefix}.%`).eq('tenant_id', tenant.id);
                const nextCode = `${prefix}.01.${String((count || 0) + 1).padStart(3, '0')}`;
                debugLog(`Gen Code: ${nextCode}`);

                const { data: newAcc, error: createError } = await supabase
                    .from('accounts')
                    .insert({
                        tenant_id: tenant.id,
                        employee_id: action.employeeId,
                        name: entityName,
                        code: nextCode,
                        type: 'standard',
                        currency: 'TRY'
                    })
                    .select('id, name')
                    .single();

                if (createError) {
                    debugLog(`Account Create Error: ${createError.message}`);
                    throw new Error('Personel hesabı oluşturulamadı: ' + createError.message);
                }
                account = newAcc;
                debugLog(`Account Created: ${account.id}`);
            }
        }

        // 2b. HR Ledger Logic (Bridge to Personnel)
        // Every sale to an employee acts as an "advance" (debt) on their HR ledger.
        if (action.employeeId && action.type === 'sale') {
            debugLog('Syncing to HR Ledger...');
            const { error: hrError } = await supabase
                .from('personnel_transactions')
                .insert({
                    tenant_id: tenant.id,
                    employee_id: action.employeeId,
                    date: new Date().toISOString().split('T')[0],
                    type: 'advance',
                    amount: action.total,
                    description: `Market Satışı - Sipariş #${order.id.slice(0, 8)}`
                });

            if (hrError) {
                console.error('HR Ledger Sync Error:', hrError);
                throw new Error('Personel hakediş kaydı (İK) oluşturulamadı: ' + hrError.message);
            }
            debugLog('HR Sync Success');
        }

        // 2c. Financial Transactions
        if (account) {
            debugLog('Processing Financial TX...');
            // Transaction 1: Charge/Credit the Entity
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    tenant_id: tenant.id,
                    account_id: account.id,
                    type: accountType,
                    amount: action.total,
                    date: new Date().toISOString().split('T')[0],
                    description: `${action.type === 'sale' ? 'Satış' : 'Alım'} - Sipariş #${order.id.slice(0, 8)}`,
                    document_type: action.type === 'sale' ? 'invoice' : 'purchase',
                    document_id: order.id,
                    created_by: user.id
                });
            if (txError) throw txError;
            debugLog('Financial TX 1 Success');

            // Transaction 2: Payment (Collection/Payment)
            if (action.paymentMethod) {
                const isSale = action.type === 'sale';

                // Determine Source/Target Account based on method
                let offsetAccountId = action.paymentAccountId;
                const methodToType = {
                    'cash': 'safe',
                    'eft': 'bank',
                    'credit_card': 'pos',
                    'check': 'check_portfolio'
                };

                const targetType = methodToType[action.paymentMethod] || 'standard';

                // If no account provided, find or create default
                if (!offsetAccountId) {
                    const { data: defaultAcc } = await supabase
                        .from('accounts')
                        .select('id')
                        .eq('tenant_id', tenant.id)
                        .eq('type', targetType)
                        .limit(1)
                        .maybeSingle();

                    if (defaultAcc) {
                        offsetAccountId = defaultAcc.id;
                    } else {
                        // Create default system account
                        const labels: Record<string, string> = { safe: 'Merkez Kasa', bank: 'Varsayılan Banka', pos: 'Merkez POS', check_portfolio: 'Çek Portföyü' };
                        const codes: Record<string, string> = { safe: '100.01', bank: '102.01', pos: '108.01', check_portfolio: action.type === 'sale' ? '101.01' : '103.01' };

                        const { data: newAcc } = await supabase
                            .from('accounts')
                            .insert({
                                tenant_id: tenant.id,
                                name: labels[targetType] || 'Varsayılan Hesap',
                                type: targetType,
                                code: codes[targetType] || '100.99',
                                currency: 'TRY'
                            })
                            .select('id')
                            .single();
                        offsetAccountId = newAcc?.id;
                    }
                }

                if (offsetAccountId) {
                    // Transaction 1: Clear the Entity Balance 
                    const { error: payError } = await supabase
                        .from('transactions')
                        .insert({
                            tenant_id: tenant.id,
                            account_id: account.id,
                            type: isSale ? 'credit' : 'debit',
                            amount: action.total,
                            date: new Date().toISOString().split('T')[0],
                            description: `Tahsilat - Sipariş #${order.id.slice(0, 8)}`,
                            document_type: 'payment',
                            document_id: order.id,
                            created_by: user.id
                        });
                    if (payError) throw payError;
                    debugLog('Financial TX 2 Success (Payment)');

                    // --- SYNC POINT: Instant Payment to HR Ledger ---
                    if (action.employeeId && isSale) {
                        debugLog('Syncing instant payment to HR...');
                        await supabase
                            .from('personnel_transactions')
                            .insert({
                                tenant_id: tenant.id,
                                employee_id: action.employeeId,
                                date: new Date().toISOString().split('T')[0],
                                type: 'payment',
                                amount: action.total,
                                description: `Peşin Ödeme - Sipariş #${order.id.slice(0, 8)}`
                            });
                    }
                    // ------------------------------------------------

                    // Transaction 2: Asset Movement
                    const { error: offsetError } = await supabase
                        .from('transactions')
                        .insert({
                            tenant_id: tenant.id,
                            account_id: offsetAccountId,
                            type: isSale ? 'debit' : 'credit',
                            amount: action.total,
                            date: new Date().toISOString().split('T')[0],
                            description: `Sipariş #${order.id.slice(0, 8)} karşılığı tahsilat`,
                            document_type: 'payment',
                            document_id: order.id,
                            created_by: user.id
                        });
                    if (offsetError) throw offsetError;

                    // Handle Check Specifics
                    if (action.paymentMethod === 'check' && action.checkDetails) {
                        const checkData: any = {
                            tenant_id: tenant.id,
                            portfolio_account_id: offsetAccountId,
                            type: isSale ? 'received' : 'issued',
                            amount: action.total,
                            due_date: action.checkDetails.dueDate,
                            serial_number: action.checkDetails.serialNumber,
                            bank_name: action.checkDetails.bankName,
                            status: 'portfolio'
                        };

                        if (action.contactId) checkData.contact_id = action.contactId;
                        if (action.employeeId) checkData.employee_id = action.employeeId;

                        await supabase.from('checks').insert(checkData);
                    }
                }
            }

            // --- SYNC POINT: Update Order Status Column ---
            if (action.paymentMethod) {
                debugLog('Updating Order Payment Status column...');
                await supabase
                    .from('orders')
                    .update({
                        payment_status: 'paid',
                        paid_amount: action.total,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', order.id);
            }
        }

        // 3. Process Stock Movements (WMS) & Update Product Prices
        // CRITICAL: Only move stock if the order is NOT pending (e.g., delivered or completed)
        // For Sales, they usually start as pending but are deducted. 
        // For Purchases, we only increment if 'delivered'.
        const shouldMoveStock = action.type === 'sale' || (action.type === 'purchase' && (action.status === 'delivered' || action.status === 'completed' || !action.status));

        if (shouldMoveStock) {
            for (const item of action.items) {
                // 3a. Stock Movement
                const moveType = action.type === 'sale' ? 'OUT' : 'IN';
                const movement = {
                    product_id: item.productId,
                    type: moveType as 'IN' | 'OUT',
                    quantity: item.quantity,
                    from_location_id: action.type === 'sale' ? activeLocationId : undefined,
                    to_location_id: action.type === 'purchase' ? activeLocationId : undefined,
                    reference_type: 'order',
                    reference_id: order.id,
                    description: `${action.type === 'sale' ? 'Müşteri Satışı' : 'Tedarikçi Alımı'} - ${action.description || ''}`
                };

                const result = await recordMovement(movement);
                if (!result.success) throw new Error(`Stock movement failed: ${result.error}`);

                // 3b. Price Persistence (PURCHASE ONLY)
                if (action.type === 'purchase') {
                    const { error: priceUpdateError } = await supabase
                        .from('prices')
                        .upsert({
                            tenant_id: tenant.id,
                            sku: item.sku.toUpperCase(),
                            amount: item.price,
                            currency: 'TRY',
                            list_key: 'purchase'
                        }, { onConflict: 'tenant_id, sku, list_key, currency' });

                    if (priceUpdateError) {
                        console.error(`Failed to update purchase price for SKU ${item.sku}:`, priceUpdateError);
                    }
                }
            }
        } else {
            debugLog('Skipping stock movement for pending purchase');
        }

        revalidatePath('/admin/accounting');
        revalidatePath('/admin/wms');
        revalidatePath('/admin/inventory');
        revalidatePath('/admin/orders');
        revalidatePath('/admin');
        debugLog('DONE');
        return { success: true, orderId: order.id };
    } catch (error: any) {
        console.error('processTradeAction Error:', error);
        debugLog(`FATAL ERROR: ${error.message}`);
        return { success: false, error: error.message };
    }
}

export async function quickCreateProduct(product: {
    title: string;
    sku: string;
    base_price: number;
    category_id?: string;
    flowType?: 'sale' | 'purchase';
    type?: 'product' | 'consumable';
    allow_sale?: boolean;
}) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // Use the official saveProduct to handle slugs, SKUs etc.
        const res = await saveProduct({
            title: product.title,
            sku: product.sku,
            type: product.type || 'product',
            is_active: true,
            allow_sale: product.allow_sale ?? (product.type === 'consumable' ? false : true),
            allow_purchase: true // Always true for new items created in trade flows
        });

        if (!res.success || !res.data) throw new Error(res.error || 'Ürün kaydedilemedi');
        const savedProduct = res.data;

        // Create the price entry
        const { error: priceError } = await supabase
            .from('prices')
            .insert({
                tenant_id: tenant.id,
                sku: savedProduct.sku,
                amount: product.base_price,
                currency: 'TRY',
                list_key: product.flowType === 'purchase' ? 'purchase' : 'standard'
            });

        if (priceError) throw priceError;

        revalidatePath('/admin/inventory');
        return {
            success: true,
            data: {
                ...savedProduct,
                prices: [{ amount: product.base_price, currency: 'TRY', list_key: product.flowType === 'purchase' ? 'purchase' : 'standard' }]
            }
        };
    } catch (error: any) {
        console.error('quickCreateProduct Error:', error);
        return { success: false, error: error.message };
    }
}
