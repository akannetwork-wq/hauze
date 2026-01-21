'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function RefreshHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('refresh') === 'true') {
            // Construct URL without the 'refresh' param
            const url = new URL(window.location.href);
            url.searchParams.delete('refresh');

            // Force a hard reload to the clean URL
            window.location.href = url.toString();
        }
    }, [searchParams, router]);

    return null;
}
