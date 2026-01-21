'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentContext } from './tenant-context';

async function getAuthenticatedClient() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) throw new Error('Unauthorized');

    const context = await getCurrentContext();
    if (!context) throw new Error('No tenant context');

    return { supabase, user, tenant: context.tenant };
}

export type NotificationType = 'missing_price' | 'unprofitable_price' | 'low_stock' | 'delayed_order';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    link: string;
    severity: 'low' | 'medium' | 'high';
    meta?: any;
}

export async function getNotifications() {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        const notifications: Notification[] = [];

        // 1. Missing Prices (Standard)
        const { data: missingPrices } = await supabase.rpc('get_products_missing_prices', { tid: tenant.id });

        // Alternative if RPC doesn't exist: Select products and prices separately and diff
        const { data: allProducts } = await supabase
            .from('products')
            .select('id, title, sku')
            .eq('tenant_id', tenant.id);

        const { data: allPrices } = await supabase
            .from('prices')
            .select('sku, list_key, amount')
            .eq('tenant_id', tenant.id);

        const priceMap = new Map();
        allPrices?.forEach(p => {
            const key = p.sku.toUpperCase();
            if (!priceMap.has(key)) priceMap.set(key, {});
            priceMap.get(key)[p.list_key] = p.amount;
        });

        allProducts?.forEach(product => {
            const sku = product.sku.toUpperCase();
            const prices = priceMap.get(sku);

            // Check Missing Price
            if (!prices || !prices.standard) {
                notifications.push({
                    id: `missing-${product.id}`,
                    type: 'missing_price',
                    title: 'Fiyat Eksik',
                    description: `${product.title} (${product.sku}) için satış fiyatı tanımlanmamış.`,
                    link: `/admin/inventory/products/${product.id}`,
                    severity: 'high'
                });
            }

            // Check Unprofitable Price
            if (prices?.standard && prices?.purchase && Number(prices.standard) < Number(prices.purchase)) {
                notifications.push({
                    id: `profit-${product.id}`,
                    type: 'unprofitable_price',
                    title: 'Zararına Satış',
                    description: `${product.title} satış fiyatı (${prices.standard}), alış fiyatından (${prices.purchase}) düşük!`,
                    link: `/admin/inventory/products/${product.id}`,
                    severity: 'high',
                    meta: { sale: prices.standard, buy: prices.purchase }
                });
            }
        });

        // 2. Low Stock (Threshold < 10 for now)
        const { data: stockItems } = await supabase
            .from('inventory_items')
            .select('sku, pool_id, state')
            .eq('tenant_id', tenant.id);

        const stockBySku = new Map<string, number>();
        stockItems?.forEach(item => {
            const sku = item.sku.toUpperCase();
            const onHand = (item.state as any)?.on_hand || 0;
            stockBySku.set(sku, (stockBySku.get(sku) || 0) + onHand);
        });

        allProducts?.forEach(product => {
            const sku = product.sku.toUpperCase();
            const totalStock = stockBySku.get(sku) || 0;
            if (totalStock < 10) {
                notifications.push({
                    id: `stock-${product.id}`,
                    type: 'low_stock',
                    title: 'Düşük Stok',
                    description: `${product.title} stoğu kritik seviyede (${totalStock} adet).`,
                    link: `/admin/inventory/products/${product.id}`,
                    severity: totalStock <= 0 ? 'high' : 'medium',
                    meta: { stock: totalStock }
                });
            }
        });

        // 3. Delayed Orders (Pending > 24h)
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const { data: delayedOrders } = await supabase
            .from('orders')
            .select('id, created_at, total, currency')
            .eq('tenant_id', tenant.id)
            .eq('status', 'pending')
            .lt('created_at', oneDayAgo.toISOString());

        delayedOrders?.forEach(order => {
            notifications.push({
                id: `order-${order.id}`,
                type: 'delayed_order',
                title: 'Geciken Sipariş',
                description: `#${order.id.slice(0, 8).toUpperCase()} nolu sipariş 24 saattir hazırlanmayı bekliyor.`,
                link: `/admin/orders/${order.id}`,
                severity: 'medium',
                meta: { date: order.created_at }
            });
        });

        return notifications;
    } catch (error) {
        console.error('getNotifications Error:', error);
        return [];
    }
}
