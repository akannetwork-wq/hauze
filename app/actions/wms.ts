'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentContext } from './tenant-context';
import { getAuthenticatedClient } from './auth-helper';


// --- Warehouses (Inventory Pools) ---

export async function getWarehouses() {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        const { data, error } = await supabase
            .from('inventory_pools')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('key');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('getWarehouses Error:', error);
        return [];
    }
}

export async function saveWarehouse(warehouse: any) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        const { data, error } = await supabase
            .from('inventory_pools')
            .upsert({
                ...warehouse,
                tenant_id: tenant.id
            })
            .select()
            .single();

        if (error) throw error;
        revalidatePath('/admin/wms');
        return { success: true, data };
    } catch (error: any) {
        console.error('saveWarehouse Error:', error);
        return { success: false, error: error.message };
    }
}

// --- Warehouse Locations ---

export async function getLocations(poolId?: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        let query = supabase
            .from('warehouse_locations')
            .select('*, inventory_pools(key)')
            .eq('tenant_id', tenant.id);

        if (poolId) query = query.eq('pool_id', poolId);

        const { data, error } = await query.order('name');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('getLocations Error:', error);
        return [];
    }
}

export async function saveLocation(location: any) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        const { data, error } = await supabase
            .from('warehouse_locations')
            .upsert({
                ...location,
                tenant_id: tenant.id,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        revalidatePath('/admin/wms');
        return { success: true, data };
    } catch (error: any) {
        console.error('saveLocation Error:', error);
        return { success: false, error: error.message };
    }
}

// --- Stock Management ---

export async function getWmsStock(filters: { warehouseId?: string, locationId?: string, productId?: string } = {}) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        let query = supabase
            .from('wms_stock')
            .select('*, products(title, sku), warehouse_locations(name, pool_id)')
            .eq('tenant_id', tenant.id);

        if (filters.warehouseId) query = query.eq('warehouse_locations.pool_id', filters.warehouseId);
        if (filters.locationId) query = query.eq('location_id', filters.locationId);
        if (filters.productId) query = query.eq('product_id', filters.productId);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('getWmsStock Error:', error);
        return [];
    }
}

export async function recordMovement(movement: {
    product_id: string;
    type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
    quantity: number;
    from_location_id?: string;
    to_location_id?: string;
    reference_type?: string;
    reference_id?: string;
    description?: string;
}) {
    try {
        const { supabase, tenant, user } = await getAuthenticatedClient();

        // 1. Record movement log
        const { error: moveError } = await supabase
            .from('wms_stock_movements')
            .insert({
                ...movement,
                tenant_id: tenant.id,
                created_by: user.id
            });

        if (moveError) throw moveError;

        // 2. Update stock levels
        if (movement.type === 'IN' || movement.type === 'ADJUSTMENT') {
            if (movement.to_location_id) {
                await updateLocationStock(supabase, tenant.id, movement.product_id, movement.to_location_id, movement.quantity);
                await updateGlobalStock(supabase, tenant.id, movement.product_id, movement.to_location_id, movement.quantity);
            }
        } else if (movement.type === 'OUT') {
            if (movement.from_location_id) {
                await updateLocationStock(supabase, tenant.id, movement.product_id, movement.from_location_id, -movement.quantity);
                await updateGlobalStock(supabase, tenant.id, movement.product_id, movement.from_location_id, -movement.quantity);
            }
        } else if (movement.type === 'TRANSFER') {
            if (movement.from_location_id && movement.to_location_id) {
                // Transfer between locations doesn't change pool level UNLESS locations are in different pools (warehouses)
                await updateLocationStock(supabase, tenant.id, movement.product_id, movement.from_location_id, -movement.quantity);
                await updateLocationStock(supabase, tenant.id, movement.product_id, movement.to_location_id, movement.quantity);

                // Sync global stock for both pools
                await updateGlobalStock(supabase, tenant.id, movement.product_id, movement.from_location_id, -movement.quantity);
                await updateGlobalStock(supabase, tenant.id, movement.product_id, movement.to_location_id, movement.quantity);
            }
        }

        revalidatePath('/admin/wms');
        return { success: true };
    } catch (error: any) {
        console.error('recordMovement Error:', error);
        return { success: false, error: error.message };
    }
}

async function updateLocationStock(supabase: any, tenantId: string, productId: string, locationId: string, delta: number) {
    // This is a simplified atomic update via upsert or separate function.
    // For production, a PG function for incrementing would be better.
    const { data: current } = await supabase
        .from('wms_stock')
        .select('quantity_on_hand')
        .eq('product_id', productId)
        .eq('location_id', locationId)
        .maybeSingle();

    const newQty = (current?.quantity_on_hand || 0) + delta;

    await supabase
        .from('wms_stock')
        .upsert({
            tenant_id: tenantId,
            product_id: productId,
            location_id: locationId,
            quantity_on_hand: newQty,
            updated_at: new Date().toISOString()
        }, { onConflict: 'product_id, location_id' });
}

async function updateGlobalStock(supabase: any, tenantId: string, productId: string, locationId: string, delta: number) {
    // 1. Get Product SKU and Location Pool
    const { data: product } = await supabase.from('products').select('sku').eq('id', productId).single();
    const { data: location } = await supabase.from('warehouse_locations').select('pool_id').eq('id', locationId).single();

    if (!product || !location || !location.pool_id) return;

    const upSku = product.sku.toUpperCase();

    // 2. Get current global state
    const { data: current } = await supabase
        .from('inventory_items')
        .select('state')
        .eq('tenant_id', tenantId)
        .eq('pool_id', location.pool_id)
        .eq('sku', upSku)
        .maybeSingle();

    const currentState = current?.state || { on_hand: 0 };
    const newQty = (currentState.on_hand || 0) + delta;

    await supabase
        .from('inventory_items')
        .upsert({
            tenant_id: tenantId,
            pool_id: location.pool_id,
            sku: upSku,
            state: { ...currentState, on_hand: newQty },
            updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id, pool_id, sku' });
}

// --- Dashboard & Shipments ---

export async function getWmsSummary() {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // Total active warehouses
        const { count: warehouses } = await supabase
            .from('inventory_pools')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);

        // Total movement count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: movements } = await supabase
            .from('wms_stock_movements')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .gte('created_at', thirtyDaysAgo.toISOString());

        // Recent 5 movements with product titles
        const { data: recentMovements } = await supabase
            .from('wms_stock_movements')
            .select('*, products(title)')
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false })
            .limit(5);

        // Low stock alerts (example: less than 10 in any location)
        const { data: lowStock } = await supabase
            .from('wms_stock')
            .select('*, products(title), warehouse_locations(name)')
            .eq('tenant_id', tenant.id)
            .lt('quantity_on_hand', 10)
            .limit(5);

        // Orders to prepare (pending or preparing)
        const { data: ordersToPrepare } = await supabase
            .from('orders')
            .select('*, contacts(company_name, first_name, last_name)')
            .eq('tenant_id', tenant.id)
            .eq('type', 'sale')
            .in('status', ['pending', 'preparing'])
            .order('created_at', { ascending: true })
            .limit(5);

        return {
            stats: {
                warehouses: warehouses || 0,
                movements: movements || 0,
                pendingOrders: ordersToPrepare?.length || 0
            },
            recentMovements: recentMovements || [],
            lowStock: lowStock || [],
            ordersToPrepare: ordersToPrepare || []
        };
    } catch (error) {
        console.error('getWmsSummary Error:', error);
        return { stats: { warehouses: 0, movements: 0, activeLocations: 0 }, recentMovements: [], lowStock: [] };
    }
}

export async function getShipments() {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        const { data, error } = await supabase
            .from('wms_shipments')
            .select('*, orders(id, total, currency)')
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('getShipments Error:', error);
        return [];
    }
}

export async function updateShipmentStatus(id: string, status: string, details: any = {}) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        const { error } = await supabase
            .from('wms_shipments')
            .update({
                status,
                ...details,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('tenant_id', tenant.id);

        if (error) throw error;
        revalidatePath('/admin/wms/shipments');
        return { success: true };
    } catch (error: any) {
        console.error('updateShipmentStatus Error:', error);
        return { success: false, error: error.message };
    }
}
