'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createTenant(formData: FormData) {
    // 1. Validate Input
    const name = formData.get('name') as string;
    const hostname = formData.get('hostname') as string;
    const adminEmail = formData.get('adminEmail') as string;
    const password = formData.get('password') as string;

    if (!name || !hostname || !adminEmail || !password) {
        return { error: 'Missing required fields' };
    }

    const supabaseAdmin = createServiceClient();

    // 2. Create Tenant Row
    const { data: tenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert({
            name,
            hostname,
            // Default config
            config: { theme: 'default' }
        })
        .select()
        .single();

    if (tenantError) {
        return { error: `Failed to create tenant: ${tenantError.message}` };
    }

    // 3. Create Admin User (Supabase Auth)
    // Note: In production, we might send an invite. Here we set password directly.
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
            // We can store global info here
        }
    });

    if (authError) {
        // Rollback? Ideally yes.
        return { error: `Created tenant but failed to create user: ${authError.message}` };
    }

    // 4. Link User to Tenant (tenant_users) -> Give Admin Role
    const { error: linkError } = await supabaseAdmin
        .from('tenant_users')
        .insert({
            tenant_id: tenant.id,
            user_id: authUser.user.id,
            roles: ['admin', 'owner']
        });

    if (linkError) {
        return { error: `Created user but failed to link to tenant: ${linkError.message}` };
    }

    // 5. Enable default modules
    const defaultModules = ['website', 'crm', 'shop'];
    const moduleInserts = defaultModules.map(key => ({
        tenant_id: tenant.id,
        module_key: key,
        is_active: true
    }));

    const { error: modError } = await supabaseAdmin
        .from('tenant_modules')
        .insert(moduleInserts);

    revalidatePath('/terminal/tenants');
    return { success: true };
}
