'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentContext } from './tenant-context';
import { recordMovement } from './wms';
import { getProducts, saveProduct } from './inventory';
import { getAuthenticatedClient } from './auth-helper';


interface TradeAction {
    type: 'sale' | 'purchase';
    contactId: string;
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
    status?: 'pending' | 'completed' | 'delivered';
}

export async function processTradeAction(action: TradeAction) {
    try {
        const { supabase, tenant, user } = await getAuthenticatedClient();

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
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                tenant_id: tenant.id,
                contact_id: action.contactId,
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

        // 2. Create Accounting Transaction
        // Sale = Debit (Customer owes us), Purchase = Credit (We owe supplier)
        const accountType = action.type === 'sale' ? 'debit' : 'credit';

        // Find primary account for this contact
        const { data: account } = await supabase
            .from('accounts')
            .select('id')
            .eq('contact_id', action.contactId)
            .eq('tenant_id', tenant.id)
            .single();

        if (account) {
            // 2a. The "Debt/Credit" Transaction (Invoice/Purchase)
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

            // 2b. The "Payment" Transaction (If not EFT)
            // If Cash/Card/Check, we auto-process the payment to balance the account
            if (action.paymentMethod && action.paymentMethod !== 'eft') {
                const paymentLabels: Record<string, string> = {
                    cash: 'Nakit',
                    credit_card: 'Kredi Kartı',
                    check: 'Çek'
                };

                const { error: payError } = await supabase
                    .from('transactions')
                    .insert({
                        tenant_id: tenant.id,
                        account_id: account.id,
                        type: action.type === 'sale' ? 'credit' : 'debit', // Opposite of the invoice
                        amount: action.total,
                        date: new Date().toISOString().split('T')[0],
                        description: `${paymentLabels[action.paymentMethod] || 'Ödeme'} - ${action.type === 'sale' ? 'Tahsilat' : 'Ödeme'} (Sipariş #${order.id.slice(0, 8)})`,
                        document_type: 'payment',
                        document_id: order.id,
                        created_by: user.id,
                        metadata: { method: action.paymentMethod, auto_processed: true }
                    });
                if (payError) throw payError;
            }
        }

        // 3. Process Stock Movements (WMS) & Update Product Prices
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
            // Update the product's purchase price in the database. 
            // Sales prices should NOT be updated automatically from a trade.
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

        revalidatePath('/admin/accounting');
        revalidatePath('/admin/wms');
        revalidatePath('/admin/inventory');
        return { success: true, orderId: order.id };
    } catch (error: any) {
        console.error('processTradeAction Error:', error);
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
