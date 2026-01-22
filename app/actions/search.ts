'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentContext } from './tenant-context';
import { getAuthenticatedClient } from './auth-helper';


export type SearchResult = {
    id: string;
    type: 'product' | 'consumable' | 'service' | 'customer' | 'supplier' | 'personnel';
    title: string;
    subtitle: string;
    link: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        const searchPattern = `%${query}%`;

        // 1. Search Products (includes consumables and services)
        const { data: products } = await supabase
            .from('products')
            .select('id, title, sku, type')
            .eq('tenant_id', tenant.id)
            .or(`title.ilike.${searchPattern},sku.ilike.${searchPattern}`)
            .limit(10);

        // 2. Search Contacts (Customers/Suppliers)
        const { data: contacts } = await supabase
            .from('contacts')
            .select('id, company_name, first_name, last_name, type')
            .eq('tenant_id', tenant.id)
            .or(`company_name.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`)
            .limit(10);

        // 3. Search Employees
        const { data: employees } = await supabase
            .from('employees')
            .select('id, first_name, last_name, position')
            .eq('tenant_id', tenant.id)
            .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`)
            .limit(10);

        const results: SearchResult[] = [];

        // Map Products
        (products || []).forEach(p => {
            let link = '';
            if (p.type === 'product') link = `/admin/inventory/products/${p.id}`;
            else if (p.type === 'consumable') link = `/admin/inventory/consumables/${p.id}`;
            else if (p.type === 'service') link = `/admin/inventory/services/${p.id}`;

            results.push({
                id: p.id,
                type: p.type as any,
                title: p.title,
                subtitle: p.sku || 'No SKU',
                link
            });
        });

        // Map Contacts
        (contacts || []).forEach(c => {
            const link = c.type === 'customer'
                ? `/admin/accounting/customers/${c.id}`
                : `/admin/accounting/suppliers/${c.id}`;

            results.push({
                id: c.id,
                type: c.type as any,
                title: c.company_name || `${c.first_name} ${c.last_name}`,
                subtitle: c.type === 'customer' ? 'Müşteri' : 'Tedarikçi',
                link
            });
        });

        // Map Employees
        (employees || []).forEach(e => {
            const link = `/admin/personnel/employees/${e.id}`;
            results.push({
                id: e.id,
                type: 'personnel',
                title: `${e.first_name} ${e.last_name}`,
                subtitle: e.position || 'Personel',
                link
            });
        });

        return results;
    } catch (error) {
        console.error('globalSearch error:', error);
        return [];
    }
}
