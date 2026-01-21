'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentContext } from './tenant-context';

// Utility to enforce tenant context
async function getAuthenticatedClient() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('Unauthorized');
    }

    // We also need to set the Session Variable for RLS!
    // However, Supabase JS Client doesn't easily support `SET app.current_tenant_id` per query via `rpc`.
    // Strategy: We rely on the `tenant_users` check in the Policy OR we assume the middleware verified hostname.
    // BUT RLS policies look for `current_setting('app.current_tenant_id')`.

    // PROBLEM: Supabase JS Client over HTTP uses connection pooling, we can't reliably SET LOCAL config.
    // SOLUTION: We must use the `tenant_id` in the WHERE clause explicitly for now, 
    // OR call a specific RPC that sets it.

    // Robust Solution:
    // 1. Get Tenant ID from Hostname (Context)
    // 2. Pass it explicitly to every query.
    // 3. RLS Policy should ALSO allow `tenant_id = (select tenant_id from tenant_users where user_id = auth.uid())`

    // Let's use the Context Helper
    const context = await getCurrentContext();
    if (!context) throw new Error('No tenant context');

    return { supabase, user, tenant: context.tenant };
}

export async function getPages() {
    const { supabase, tenant } = await getAuthenticatedClient();

    const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('menu_location', { ascending: true })
        .order('sort_order', { ascending: true });

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

export async function createPage(formData: FormData) {
    const { supabase, tenant } = await getAuthenticatedClient();

    const title = formData.get('title') as string;
    const path = formData.get('path') as string;
    const menu_location = formData.get('menu_location') as string || 'main'; // Get from form
    const parent_id = formData.get('parent_id') as string || null;
    const template = formData.get('template') as string || 'standard';

    console.log('Creating page:', { title, path, menu_location, tenant: tenant.id });

    if (!title || !path) {
        console.error('Missing fields');
        return { error: 'Missing fields' };
    }

    const { error } = await supabase
        .from('pages')
        .insert({
            tenant_id: tenant.id,
            title,
            path,
            template_key: template,
            sections: [],
            menu_location: menu_location,
            parent_id: parent_id,
            sort_order: 99,
            locales: {}
        });

    if (error) {
        console.error('Create Page Error:', error);
        return { error: error.message };
    }

    revalidatePath('/admin/pages');
    return { success: true };
}

export async function getPage(id: string) {
    const { supabase, tenant } = await getAuthenticatedClient();

    // Security check: Ensure page belongs to tenant
    const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single();

    if (error) return null;
    return data;
}

export async function updatePage(id: string, updates: any) {
    const { supabase, tenant } = await getAuthenticatedClient();

    // Sanitize update keys to avoid injection/overwriting sensitive fields
    const safeUpdates = {
        title: updates.title,
        path: updates.path,
        sections: updates.sections, // JSONB content
        is_published: updates.is_published,
        menu_location: updates.menu_location,
        parent_id: updates.parent_id,
        sort_order: updates.sort_order,
        cover_image: updates.cover_image,
        cover_thumb: updates.cover_thumb,
        locales: updates.locales,
        updated_at: new Date().toISOString()
    };


    const { error } = await supabase
        .from('pages')
        .update(safeUpdates)
        .eq('id', id)
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Update Page Error:', error);
        return { error: error.message };
    }

    revalidatePath(`/admin/pages/${id}`);
    revalidatePath('/admin/pages');
    return { success: true };
}

export async function updatePageOrder(items: { id: string; sort_order: number; menu_location: string; parent_id?: string | null }[]) {
    const { supabase, tenant } = await getAuthenticatedClient();

    for (const item of items) {
        const updateData: any = {
            sort_order: item.sort_order,
            menu_location: item.menu_location
        };

        if (item.parent_id !== undefined) {
            updateData.parent_id = item.parent_id;
        }

        await supabase
            .from('pages')
            .update(updateData)
            .eq('id', item.id)
            .eq('tenant_id', tenant.id);
    }

    revalidatePath('/admin/pages');
    return { success: true };
}

export async function deletePage(id: string) {
    const { supabase, tenant } = await getAuthenticatedClient();

    // First check if page has children
    const { data: children } = await supabase
        .from('pages')
        .select('id')
        .eq('parent_id', id)
        .eq('tenant_id', tenant.id);

    if (children && children.length > 0) {
        return { error: 'Cannot delete page with subpages. Delete subpages first.' };
    }

    // NEW: Cleanup storage folder (images, thumbnails)
    try {
        const { deletePageStorage } = await import('./storage');
        await deletePageStorage(id);
    } catch (e) {
        console.error('Storage cleanup failed during page delete:', e);
        // We continue with database deletion even if storage cleanup fails 
        // to avoid persistent "dead" records, but we log the error.
    }

    const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Delete Page Error:', error);
        return { error: error.message };
    }

    revalidatePath('/admin/pages');
    return { success: true };
}

export async function checkPathAvailability(path: string, excludeId?: string) {
    const { supabase, tenant } = await getAuthenticatedClient();

    let query = supabase
        .from('pages')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('path', path);

    if (excludeId) {
        query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Check Path Error:', error);
        return { error: error.message };
    }

    return { available: data.length === 0 };
}

export async function getUniquePath(basePath: string, excludeId?: string) {
    const { supabase, tenant } = await getAuthenticatedClient();

    let currentPath = basePath;
    let counter = 0;
    let isUnique = false;

    while (!isUnique) {
        const checkPath = counter === 0 ? currentPath : `${currentPath}-${counter}`;

        let query = supabase
            .from('pages')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('path', checkPath);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Check Path Error:', error);
            throw new Error(error.message);
        }

        if (data.length === 0) {
            isUnique = true;
            currentPath = checkPath;
        } else {
            counter++;
        }

        // Safety break to prevent infinite loop
        if (counter > 100) {
            throw new Error('Too many slug collisions');
        }
    }

    return currentPath;
}
