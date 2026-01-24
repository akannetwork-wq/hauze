import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { getCurrentContext } from './tenant-context';

/**
 * Centrally managed authentication helper for Server Actions and Server Components.
 * Memoized via React.cache to ensure that within a single request, the auth check
 * and tenant context lookups only happen once.
 */
export const getAuthenticatedClient = cache(async () => {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('Unauthorized');
    }

    // Use the Context Helper to get tenant info based on hostname
    const context = await getCurrentContext();
    if (!context) {
        throw new Error('No tenant context');
    }

    // Fetch user role and permissions for this tenant
    const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('role, permissions')
        .eq('tenant_id', context.tenant.id)
        .eq('user_id', user.id)
        .single();

    // Check if user is linked to an employee record
    const { data: employee } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position')
        .eq('user_id', user.id)
        .eq('tenant_id', context.tenant.id)
        .single();

    return {
        supabase,
        user,
        tenant: context.tenant,
        modules: context.modules,
        role: tenantUser?.role || 'user',
        permissions: tenantUser?.permissions || {},
        employee: employee || null
    };
});
