'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { getCurrentContext } from './tenant-context';

export async function login(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // 1. Authenticate with Supabase (Global)
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    if (!user) {
        return { error: 'Authentication failed' };
    }

    // 2. Resolve Tenant Context (Hostname)
    const context = await getCurrentContext();

    // If context is null, it means we are on a domain that doesn't exist in tenants table
    // or maybe localhost root.
    if (!context) {
        await supabase.auth.signOut();
        return { error: 'Unknown tenant environment.' };
    }

    const { tenant } = context;

    // 3. Verify User Belongs to This Tenant
    const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user.id)
        .single();

    if (!tenantUser) {
        // User is authenticated globally, but does NOT have a seat in this tenant.
        await supabase.auth.signOut();
        return { error: 'Access Denied: You are not a member of this tenant.' };
    }



    // revalidatePath('/', 'layout'); // Removing this to prevent potential host mismatch on re-render

    // Instead of redirecting from server, return success so client can handle
    // the hard refresh.
    return { success: true };
}





export async function logout() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Logout error:', error);
    }

    revalidatePath('/', 'layout');
    redirect('/login');
}
