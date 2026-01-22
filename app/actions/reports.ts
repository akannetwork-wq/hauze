'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentContext } from './tenant-context';
import { getAuthenticatedClient } from './auth-helper';


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
