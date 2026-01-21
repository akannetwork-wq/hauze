
import { createClient } from '@/lib/supabase/client'; // Use client for public fetch? Or Server?
// Better to use Server Action? No, we are in RSC.
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getTenantByHostname } from './tenant-context';

export async function getPageBySlug(hostname: string, slugPath: string) {
    // 1. Resolve Tenant
    const { tenant } = await getTenantByHostname(hostname);
    if (!tenant) return null;

    const supabase = await createServerClient();

    // 2. Fetch Page
    // "Public Read Published" policy will handle safety if enabled, 
    // OR we use service role if we want to bypass RLS for public static generation?
    // Let's stick to standard client + RLS.
    // BUT RLS requires `app.current_tenant_id` to be set.
    // In a RSC access pattern, we haven't set the config session var for the PG connection pool easily.
    // So we must manually query by tenant_id.

    // Ensure path starts with /
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
}

export async function getPublicPages(hostname: string, menu_location: string = 'main') {
    const { tenant } = await getTenantByHostname(hostname);
    if (!tenant) return [];

    const supabase = await createServerClient();

    const { data } = await supabase
        .from('pages')
        .select('title, path, locales')
        .eq('tenant_id', tenant.id)
        .eq('menu_location', menu_location)
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

    return data || [];
}
