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

    return {
        supabase,
        user,
        tenant: context.tenant,
        modules: context.modules
    };
});
