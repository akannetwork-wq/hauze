'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentContext } from './tenant-context';
import { Product, ProductCategory } from '@/types';
import { generateSlug } from '@/lib/slug';

async function getAuthenticatedClient() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) throw new Error('Unauthorized');

    const context = await getCurrentContext();
    if (!context) throw new Error('No tenant context');

    return { supabase, user, tenant: context.tenant };
}

// --- Product Categories ---

export async function getCategories(type?: 'product' | 'consumable' | 'service') {
    const { supabase, tenant } = await getAuthenticatedClient();

    let query = supabase
        .from('product_categories')
        .select('*')
        .eq('tenant_id', tenant.id);

    if (type) query = query.eq('type', type);

    const { data, error } = await query
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Fetch Categories Error:', error);
        return [];
    }
    return data as ProductCategory[];
}

export async function saveCategory(category: Partial<ProductCategory>) {
    const { supabase, tenant } = await getAuthenticatedClient();

    // Strip any possible virtual fields
    const { ...dbCategory } = category as any;

    const categoryData = {
        ...dbCategory,
        tenant_id: tenant.id,
        type: dbCategory.type || 'product',
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('product_categories')
        .upsert(categoryData)
        .select()
        .single();

    if (error) {
        console.error('Save Category Error:', error);
        return { error: error.message };
    }

    revalidatePath('/admin/inventory/categories');
    revalidatePath('/admin/inventory');
    return { success: true, data };
}


export async function getCategory(id: string) {
    const { supabase, tenant } = await getAuthenticatedClient();

    const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single();

    if (error) return null;
    return data as ProductCategory;
}

export async function deleteCategory(id: string) {
    const { supabase, tenant } = await getAuthenticatedClient();

    const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Delete Category Error:', error);
        return { error: error.message };
    }

    revalidatePath('/admin/inventory/categories');
    revalidatePath('/admin/inventory');
    return { success: true };
}

export async function updateCategoryOrder(items: { id: string; sort_order: number }[]) {
    const { supabase, tenant } = await getAuthenticatedClient();

    for (const item of items) {
        await supabase
            .from('product_categories')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
            .eq('tenant_id', tenant.id);
    }

    revalidatePath('/admin/inventory/categories');
    return { success: true };
}

// --- Products ---

export async function getProducts(options: {
    type?: 'product' | 'consumable' | 'service',
    allowSale?: boolean,
    allowPurchase?: boolean,
    allowConsumable?: boolean,
    isEcommerceActive?: boolean,
    categoryId?: string,
    search?: string,
    status?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
} = {}) {
    const { supabase, tenant } = await getAuthenticatedClient();

    let query = supabase
        .from('products')
        .select(`
            *,
            category_rels:product_category_rels(category_id)
        `)
        .eq('tenant_id', tenant.id);

    if (options.type) query = query.eq('type', options.type);

    // For sales, we must be strict: 
    // - If allowSale is true, only show those explicitly marked as true.
    // - For products, the default (null) usually means true, but for consumables it means false.
    if (options.allowSale === true) {
        query = query.eq('allow_sale', true);
    } else if (options.allowSale === false) {
        query = query.eq('allow_sale', false);
    }
    if (options.allowPurchase !== undefined) query = query.eq('allow_purchase', options.allowPurchase);
    if (options.allowConsumable !== undefined) query = query.eq('allow_consumable', options.allowConsumable);
    if (options.isEcommerceActive !== undefined) query = query.eq('is_ecommerce_active', options.isEcommerceActive);

    // Status filter
    if (options.status === 'active') query = query.eq('is_active', true);
    if (options.status === 'passive') query = query.eq('is_active', false);

    // Search filter (Title, SKU, Barcode)
    if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,sku.ilike.%${options.search}%,barcode.ilike.%${options.search}%`);
    }

    // Category filter
    if (options.categoryId) {
        // We use inner join for category filter
        query = supabase
            .from('products')
            .select('*, category_rels:product_category_rels!inner(category_id)')
            .eq('tenant_id', tenant.id)
            .eq('product_category_rels.category_id', options.categoryId);

        if (options.type) query = query.eq('type', options.type);
        if (options.allowSale !== undefined) query = query.eq('allow_sale', options.allowSale);
        if (options.allowPurchase !== undefined) query = query.eq('allow_purchase', options.allowPurchase);
        if (options.allowConsumable !== undefined) query = query.eq('allow_consumable', options.allowConsumable);
        if (options.isEcommerceActive !== undefined) query = query.eq('is_ecommerce_active', options.isEcommerceActive);
        if (options.search) query = query.or(`title.ilike.%${options.search}%,sku.ilike.%${options.search}%,barcode.ilike.%${options.search}%`);
        if (options.status === 'active') query = query.eq('is_active', true);
        if (options.status === 'passive') query = query.eq('is_active', false);
    }

    // Sorting
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data: products, error } = await query;

    if (error) {
        console.error('Fetch Products Error:', error);
        return [];
    }

    if (products && products.length > 0) {
        const skus = products.map(p => p.sku);
        const { data: prices } = await supabase
            .from('prices')
            .select('*')
            .in('sku', skus)
            .eq('tenant_id', tenant.id);

        return products.map(p => ({
            ...p,
            prices: prices?.filter(pr => pr.sku === p.sku) || []
        })) as Product[];
    }

    return products as Product[];
}

export async function getProduct(id: string) {
    const { supabase, tenant } = await getAuthenticatedClient();

    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            category_info:product_categories!products_category_id_fkey(name),
            category_rels:product_category_rels!product_category_rels_product_id_fkey(category_id),
            variants:product_variants(*, inventory:inventory_items!inventory_items_variant_id_fkey(*)),
            digital_meta:product_digital_meta(*)
        `)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single();

    if (error) {
        console.error('Get Product Error:', error.message);
        return null;
    }

    const product = data as any;
    return {
        ...product,
        category: product.category_info ? { name: product.category_info.name } : null,
        category_ids: product.category_rels?.map((r: any) => r.category_id) || [],
        variants: product.variants || [],
        digital_meta: product.digital_meta?.[0] || null // select() return array for joins
    } as Product;
}

export async function saveProduct(product: Partial<Product>) {
    const { supabase, tenant } = await getAuthenticatedClient();

    // Strip virtual joined fields
    const {
        category,
        category_info,
        category_rels,
        variants,
        digital_meta,
        price,
        inventory,
        category_ids,
        ...dbProduct
    } = product as any;

    // 1. Generate Auto-SKU if missing (Pattern: {TenantInitial}-{CategoryShortCodes}-{RandomID})
    if (!dbProduct.sku) {
        const tenantInitial = (tenant.name || 'N').charAt(0).toUpperCase();
        let parts = [tenantInitial];

        if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
            category_ids.slice(0, 3).forEach(catId => {
                const segments = catId.split('-');
                const code = segments.length > 1 ? segments[1].substring(0, 2) : catId.substring(0, 2);
                parts.push(code.toUpperCase());
            });
        }
        parts.push(Math.floor(Math.random() * 900 + 100).toString());
        dbProduct.sku = parts.join('-');
    }

    // 2. Slug Collision Resolution
    let baseSlug = dbProduct.slug || generateSlug(dbProduct.title || 'item');
    if (!baseSlug || baseSlug === 'item') baseSlug = `item-${Math.floor(Math.random() * 1000)}`;

    // Check if slug exists for this tenant (excluding own ID if updating)
    let isUnique = false;
    let counter = 0;
    let finalSlug = baseSlug;

    while (!isUnique) {
        let query = supabase
            .from('products')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('slug', finalSlug);

        if (dbProduct.id) query = query.neq('id', dbProduct.id);

        const { data: existing } = await query.maybeSingle();

        if (!existing) {
            isUnique = true;
        } else {
            counter++;
            finalSlug = `${baseSlug}-${counter}`;
        }
    }
    dbProduct.slug = finalSlug;

    const { data, error } = await supabase
        .from('products')
        .upsert({
            ...dbProduct,
            tenant_id: tenant.id,
            allow_sale: dbProduct.allow_sale ?? (dbProduct.type === 'consumable' ? false : true),
            allow_purchase: dbProduct.allow_purchase ?? true,
            allow_consumable: dbProduct.allow_consumable ?? false,
            is_ecommerce_active: dbProduct.is_ecommerce_active ?? false,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Save Product Error:', error);
        return { error: error.message };
    }

    const savedProduct = data;

    // Handle Multiple Categories (Junction Table)
    if (category_ids && Array.isArray(category_ids)) {
        await supabase.from('product_category_rels').delete().eq('product_id', savedProduct.id);
        if (category_ids.length > 0) {
            const rels = category_ids.map(catId => ({ product_id: savedProduct.id, category_id: catId }));
            await supabase.from('product_category_rels').insert(rels);
        }
    }

    // Handle Variants (Synchronization)
    if (variants && Array.isArray(variants)) {
        // 1. Delete removed variants
        const variantIds = variants.map(v => v.id).filter(id => !!id);

        let deleteQuery = supabase.from('product_variants').delete().eq('product_id', savedProduct.id);
        if (variantIds.length > 0) {
            deleteQuery = deleteQuery.not('id', 'in', variantIds);
        }

        const { error: deleteError } = await deleteQuery;
        if (deleteError) {
            console.error('Variant Delete Sync Error:', deleteError);
        }

        // 2. Upsert current variants
        if (variants.length > 0) {
            const variantsData = variants.map(v => {
                const {
                    id,
                    created_at,
                    updated_at,
                    inventory,
                    initial_stock,
                    category_info,
                    price_info,
                    tenant_id,
                    product_id,
                    ...vData
                } = v as any;

                return {
                    ...vData,
                    product_id: savedProduct.id,
                    tenant_id: tenant.id,
                    updated_at: new Date().toISOString()
                };
            });
            const { error: variantError } = await supabase
                .from('product_variants')
                .upsert(variantsData, { onConflict: 'tenant_id, sku' });
            if (variantError) {
                console.error('Variant Upsert Error:', variantError);
                return { error: 'Varyasyonlar kaydedilirken hata oluştu: ' + variantError.message };
            }
        }
    }

    // Handle Digital Meta
    if (digital_meta) {
        const metaData = {
            ...digital_meta,
            product_id: savedProduct.id,
            tenant_id: tenant.id,
            updated_at: new Date().toISOString()
        };
        await supabase.from('product_digital_meta').upsert(metaData);
    }

    revalidatePath('/admin/inventory');

    // Return full data so frontend has IDs
    const finalProduct = await getProduct(savedProduct.id);
    return { success: true, data: finalProduct };
}

export async function deleteProduct(id: string) {
    const { supabase, tenant } = await getAuthenticatedClient();

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

    if (error) {
        console.error('Delete Product Error:', error);
        return { error: error.message };
    }

    revalidatePath('/admin/inventory');
    return { success: true };
}
