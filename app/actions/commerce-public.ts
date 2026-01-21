
import { createClient } from '@/lib/supabase/server';

export async function getPublicProducts(tenantId: string) {
    const supabase = await createClient();

    // Fetch prices (products) that act as our catalog for now
    // Join with inventory items?
    const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sku');

    if (error) return [];
    return data;
}
