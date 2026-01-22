import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { getTenantByHostname } from './tenant-context';

export const getPageBySlug = unstable_cache(
    async (hostname: string, slugPath: string) => {
        // 1. Resolve Tenant
        const { tenant } = await getTenantByHostname(hostname);
        if (!tenant) return null;

        const supabase = createServiceClient();

        // 2. Fetch Page
        const path = '/' + slugPath.replace(/^home$/, ''); // treat 'home' as /
        const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, ''); // remove trailing slash

        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('path', normalizedPath)
            .eq('is_published', true)
            .single();

        if (error) return null;

        return { page: data, tenant };
    },
    ['page-by-slug'],
    { revalidate: 3600, tags: ['pages'] }
);

export const getPublicPages = unstable_cache(
    async (hostname: string, menu_location: string = 'main') => {
        const { tenant } = await getTenantByHostname(hostname);
        if (!tenant) return [];

        const supabase = createServiceClient();

        const { data } = await supabase
            .from('pages')
            .select('title, path, locales')
            .eq('tenant_id', tenant.id)
            .eq('menu_location', menu_location)
            .eq('is_published', true)
            .order('sort_order', { ascending: true });

        return data || [];
    },
    ['public-pages'],
    { revalidate: 3600, tags: ['pages'] }
);
