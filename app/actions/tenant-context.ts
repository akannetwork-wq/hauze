
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function getTenantByHostname(hostname: string) {
    const supabase = await createClient();

    // In a real app, we cache this heavily (Redis/Vercel KV)
    const { data, error } = await supabase
        .from('tenants')
        .select('id, name, config')
        .eq('hostname', hostname)
        .single();

    return { tenant: data, error };
}

export async function getTenantModules(tenantId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenant_modules')
        .select(`
            is_active,
            modules ( key, name )
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

    if (error) return [];

    // Flatten structure
    return data.map((row: any) => ({
        key: row.modules.key,
        name: row.modules.name
    }));
}

export async function getCurrentContext() {
    // 1. Get Hostname
    const headersList = await headers();
    const host = headersList.get('host')!;
    // handle localhost port
    const hostname = host.split(':')[0];

    console.log('[TenantContext] Host:', host, '-> Hostname:', hostname);


    // TODO: Handle 'app' subdomain vs custom domains
    // For this stage, we assume the hostname IS the tenant hostname
    // But wait, the Admin Panel runs on 'app.netspace.com' (logically) or 'tenant.netspace.com'?
    // The requirement says: "Tenant admin panels: *.domain.com/admin"
    // So if I am at "acme.netspace.com/admin", the hostname is "acme.netspace.com".

    const { tenant, error } = await getTenantByHostname(hostname);

    if (error || !tenant) {
        return null; // Handle 404
    }

    const modules = await getTenantModules(tenant.id);

    return { tenant, modules };
}
