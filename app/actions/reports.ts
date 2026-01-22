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

export async function getCachedReport(name: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        const { data, error } = await supabase
            .from('report_cache')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('report_name', name)
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`Error fetching cached report "${name}":`, error);
        return null;
    }
}

export async function saveReportCache(name: string, data: any) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        const { error } = await supabase
            .from('report_cache')
            .upsert({
                tenant_id: tenant.id,
                report_name: name,
                data: data,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id, report_name' });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error(`Error saving report cache "${name}":`, error);
        return { success: false, error };
    }
}
