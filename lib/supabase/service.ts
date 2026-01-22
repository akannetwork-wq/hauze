
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceKey) {
        // If we're missing the key (e.g. during build), return a proxy that returns nulls
        // This prevents the build from crashing with Exit 1.
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
            'placeholder',
            { auth: { persistSession: false } }
        )
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
