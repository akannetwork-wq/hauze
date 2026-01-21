'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentContext } from './tenant-context';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadCoverImage(pageId: string, formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { error: 'No file provided' };
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return { error: 'Invalid file type. Only JPG, PNG and WebP are allowed.' };
        }

        if (file.size > MAX_FILE_SIZE) {
            return { error: 'File too large. Max 5MB allowed.' };
        }

        const context = await getCurrentContext();
        if (!context) throw new Error('Unauthorized');

        const supabase = await createClient();
        const tenantId = context.tenant.id;

        // Read file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Process images using sharp
        const mainImageBuffer = await sharp(buffer)
            .resize(1200, null, { withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        const thumbImageBuffer = await sharp(buffer)
            .resize(400, null, { withoutEnlargement: true })
            .webp({ quality: 70 })
            .toBuffer();

        const timestamp = Date.now();
        const mainPath = `${tenantId}/pages/${pageId}/cover_${timestamp}.webp`;
        const thumbPath = `${tenantId}/pages/${pageId}/cover_thumb_${timestamp}.webp`;

        // Upload main image
        const { error: mainError } = await supabase.storage
            .from('cms')
            .upload(mainPath, mainImageBuffer, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: true
            });

        if (mainError) throw mainError;

        // Upload thumbnail
        const { error: thumbError } = await supabase.storage
            .from('cms')
            .upload(thumbPath, thumbImageBuffer, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: true
            });

        if (thumbError) throw thumbError;

        // Get public URLs
        const { data: { publicUrl: mainUrl } } = supabase.storage
            .from('cms')
            .getPublicUrl(mainPath);

        const { data: { publicUrl: thumbUrl } } = supabase.storage
            .from('cms')
            .getPublicUrl(thumbPath);

        return {
            success: true,
            url: mainUrl,
            thumbUrl: thumbUrl
        };

    } catch (error: any) {
        console.error('Upload Error:', error);
        return { error: error.message || 'Failed to upload image' };
    }
}

export async function uploadProductImage(productId: string, formData: FormData, type: 'cover' | 'gallery' | 'variant' = 'cover', variantId?: string) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { error: 'No file provided' };
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return { error: 'Invalid file type. Only JPG, PNG and WebP are allowed.' };
        }

        if (file.size > MAX_FILE_SIZE) {
            return { error: 'File too large. Max 5MB allowed.' };
        }

        const context = await getCurrentContext();
        if (!context) throw new Error('Unauthorized');

        const supabase = await createClient();
        const tenantId = context.tenant.id;

        // Read file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Process images using sharp
        const mainImageBuffer = await sharp(buffer)
            .resize(type === 'variant' ? 800 : 1200, null, { withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        const timestamp = Date.now();
        let fileName = `${type}_${timestamp}.webp`;
        if (type === 'variant' && variantId) {
            fileName = `variant_${variantId}_${timestamp}.webp`;
        } else if (type === 'gallery') {
            fileName = `gallery_${nanoid(8)}_${timestamp}.webp`;
        }

        const folderPath = `${tenantId}/products/${productId}`;
        const mainPath = `${folderPath}/${fileName}`;

        // Upload main image
        const { error: mainError } = await supabase.storage
            .from('cms')
            .upload(mainPath, mainImageBuffer, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: true
            });

        if (mainError) throw mainError;

        let thumbUrl = null;
        if (type === 'cover') {
            const thumbImageBuffer = await sharp(buffer)
                .resize(400, null, { withoutEnlargement: true })
                .webp({ quality: 70 })
                .toBuffer();

            const thumbPath = `${folderPath}/cover_thumb_${timestamp}.webp`;
            const { error: thumbError } = await supabase.storage
                .from('cms')
                .upload(thumbPath, thumbImageBuffer, {
                    contentType: 'image/webp',
                    cacheControl: '3600',
                    upsert: true
                });
            if (thumbError) throw thumbError;

            const { data: { publicUrl } } = supabase.storage
                .from('cms')
                .getPublicUrl(thumbPath);
            thumbUrl = publicUrl;
        }

        // Get public URL
        const { data: { publicUrl: mainUrl } } = supabase.storage
            .from('cms')
            .getPublicUrl(mainPath);

        return {
            success: true,
            url: mainUrl,
            thumbUrl: thumbUrl,
            path: mainPath
        };

    } catch (error: any) {
        console.error('Product Upload Error:', error);
        return { error: error.message || 'Failed to upload image' };
    }
}

export async function deleteStorageObject(path: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase.storage
            .from('cms')
            .remove([path]);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Delete Storage Error:', error);
        return { error: error.message };
    }
}

export async function deletePageStorage(pageId: string) {
    try {
        const context = await getCurrentContext();
        if (!context) throw new Error('Unauthorized');

        const supabase = await createClient();
        const tenantId = context.tenant.id;
        const folderPath = `${tenantId}/pages/${pageId}`;

        // List all files in the folder
        const { data: files, error: listError } = await supabase.storage
            .from('cms')
            .list(folderPath);

        if (listError) {
            console.error('List files error:', listError);
            return { error: listError.message };
        }

        if (files && files.length > 0) {
            const filesToDelete = files.map(file => `${folderPath}/${file.name}`);
            const { error: deleteError } = await supabase.storage
                .from('cms')
                .remove(filesToDelete);

            if (deleteError) throw deleteError;
        }

        return { success: true };
    } catch (error: any) {
        console.error('Delete Folder Error:', error);
        return { error: error.message };
    }
}
