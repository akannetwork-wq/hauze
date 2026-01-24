'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedClient } from './auth-helper';

export async function getTenantUsers() {
    try {
        const { supabase, tenant, role } = await getAuthenticatedClient();

        if (role !== 'super_admin' && role !== 'admin') {
            throw new Error('Yetkiniz yok.');
        }

        // We join tenant_users with profiles to get identifiable info
        const { data, error } = await supabase
            .from('tenant_users')
            .select(`
                id,
                user_id,
                role,
                permissions,
                created_at,
                profiles:user_id (
                    email,
                    full_name,
                    avatar_url
                )
            `)
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('getTenantUsers Fetch Error:', error);
            throw error;
        }

        console.log(`[getTenantUsers] Found ${data?.length || 0} users for tenant ${tenant.id}`);
        if (data && data.length > 0) {
            console.log('[getTenantUsers] First user sample:', JSON.stringify(data[0], null, 2));
        }

        return data || [];
    } catch (error: any) {
        console.error('getTenantUsers Error:', error);
        return [];
    }
}

export async function updateUserPermissions(targetUserId: string, permissions: any) {
    try {
        const { supabase, tenant, role, user: currentUser } = await getAuthenticatedClient();

        if (role !== 'super_admin') {
            throw new Error('Sadece Süper Admin yetki düzenleyebilir.');
        }

        // Prevent self-lockout or modifying other super-admins if needed?
        // For now, allow super_admin to do anything.

        const { error } = await supabase
            .from('tenant_users')
            .update({ permissions })
            .eq('tenant_id', tenant.id)
            .eq('user_id', targetUserId);

        if (error) throw error;

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.error('updateUserPermissions Error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateUserRole(targetUserId: string, newRole: string) {
    try {
        const { supabase, tenant, role, user: currentUser } = await getAuthenticatedClient();

        if (role !== 'super_admin') {
            throw new Error('Sadece Süper Admin rol değiştirebilir.');
        }

        // Prevent self-demotion
        if (targetUserId === currentUser.id && newRole !== 'super_admin') {
            throw new Error('Kendi Süper Admin yetkinizi geri alamazsınız.');
        }

        const { error } = await supabase
            .from('tenant_users')
            .update({ role: newRole })
            .eq('tenant_id', tenant.id)
            .eq('user_id', targetUserId);

        if (error) throw error;

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.error('updateUserRole Error:', error);
        return { success: false, error: error.message };
    }
}

export async function createUser(email: string, password?: string, role: string = 'user', employeeId?: string) {
    try {
        const { tenant, role: currentUserRole } = await getAuthenticatedClient();

        if (role !== 'super_admin' && currentUserRole !== 'super_admin') {
            // Only super admins can create other users, especially other super admins
            if (currentUserRole !== 'super_admin') throw new Error('Yetkiniz yok.');
        }

        const supabaseService = createServiceClient();

        // 1. Check if user already exists globally
        const { data: { users }, error: listError } = await supabaseService.auth.admin.listUsers();
        if (listError) throw listError;

        let targetUser = users.find(u => u.email === email);

        if (!targetUser) {
            if (password) {
                // 2a. Create user DIRECTLY with password
                const { data: createData, error: createError } = await supabaseService.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { full_name: email.split('@')[0] }
                });
                if (createError) throw createError;
                targetUser = createData.user;
            } else {
                // 2b. Fallback to Invite
                const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
                const redirectTo = `${protocol}://${tenant.hostname}/login`;

                const { data: inviteData, error: inviteError } = await supabaseService.auth.admin.inviteUserByEmail(email, {
                    redirectTo: redirectTo
                });
                if (inviteError) throw inviteError;
                targetUser = inviteData.user;
            }
        }

        if (!targetUser) throw new Error('Kullanıcı oluşturulamadı.');

        // 3. Add to tenant_users
        const { error: linkError } = await supabaseService
            .from('tenant_users')
            .upsert({
                tenant_id: tenant.id,
                user_id: targetUser.id,
                role: role,
                permissions: {}
            }, { onConflict: 'tenant_id, user_id' });

        if (linkError) {
            console.error('createUser tenant_users Link Error:', linkError);
            throw linkError;
        }

        // 4. LINK TO EMPLOYEE (If provided)
        if (employeeId) {
            const { error: empError } = await supabaseService
                .from('employees')
                .update({ user_id: targetUser.id })
                .eq('id', employeeId)
                .eq('tenant_id', tenant.id);

            if (empError) {
                console.error('createUser Employee Link Error:', empError);
                // Note: We don't throw here to avoid rollback of auth/tenant-user, 
                // but we should probably inform the UI.
            }
        }

        console.log(`[createUser] Successfully linked user ${targetUser.id} to tenant ${tenant.id} as ${role}${employeeId ? ' (Employee Link)' : ''}`);

        revalidatePath('/admin/users');
        revalidatePath('/admin/personnel');
        return { success: true };
    } catch (error: any) {
        console.error('createUser Error:', error);
        return { success: false, error: error.message };
    }
}

export async function removeUserFromTenant(userId: string) {
    try {
        const { supabase, tenant, role, user: currentUser } = await getAuthenticatedClient();

        if (role !== 'super_admin') {
            throw new Error('Yetkiniz yok.');
        }

        if (userId === currentUser.id) {
            throw new Error('Kendinizi silemezsiniz.');
        }

        const { error } = await supabase
            .from('tenant_users')
            .delete()
            .eq('tenant_id', tenant.id)
            .eq('user_id', userId);

        if (error) throw error;

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.error('removeUserFromTenant Error:', error);
        return { success: false, error: error.message };
    }
}
