import { headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createServiceClient } from '@/lib/supabase/service';

// Cache tenant lookup for 1 hour
// CRITICAL: We use createServiceClient (cookie-less) because unstable_cache 
// runs in a context where cookies() are not available.
export const getTenantByHostname = unstable_cache(
    async (hostname: string) => {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('tenants')
            .select('id, name, hostname, config')
            .eq('hostname', hostname)
            .single();

        return { tenant: data, error };
    },
    ['tenant-by-hostname'],
    { revalidate: 3600, tags: ['tenants'] }
);

// Cache module lookup for 1 hour
export const getTenantModules = unstable_cache(
    async (tenantId: string) => {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('tenant_modules')
            .select(`
                is_active,
                modules ( key, name )
            `)
            .eq('tenant_id', tenantId)
            .eq('is_active', true);

        if (error) return [];

        return data.map((row: any) => ({
            key: row.modules.key,
            name: row.modules.name
        }));
    },
    ['tenant-modules'],
    { revalidate: 3600, tags: ['tenant-modules'] }
);

// Memoize context for the duration of a single request
export const getCurrentContext = cache(async () => {
    // 1. Get Hostname
    let headersList;
    try {
        headersList = await headers();
    } catch (e) {
        // Next.js 16: headers() may reject during prerendering
        return null;
    }

    const host = headersList.get('host')!;
    const hostname = host.split(':')[0];

    const { tenant, error } = await getTenantByHostname(hostname);

    if (error || !tenant) {
        return null;
    }

    const modules = await getTenantModules(tenant.id);

    return { tenant, modules };
});
