import { NextRequest, NextResponse } from 'next/server';

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images/ (local images)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const host = req.headers.get('host')!;
    const hostname = host.split(':')[0];

    // Default response
    let response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';
    const isRootDomain = hostname === rootDomain;

    const isLocalhost = hostname.includes('localhost');

    // Terminal Logic (Super Admin)
    const isTerminal = hostname.startsWith('terminal') || url.pathname.startsWith('/terminal');

    // App Logic (Tenant Admin)
    const isApp = hostname.startsWith('app') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/login');

    // ---------------------------------------------------------
    // Root Domain Logic (Main Site)
    // ---------------------------------------------------------
    if (isRootDomain && !isTerminal && !isApp) {
        // Ana domaindeysek ve terminal/admin gitmiyorsak, isteği serbest bırakıyoruz.
        // Bu sayede app/(main) klasöründeki rotalar direkt çalışacak.
        return response;
    }

    // ---------------------------------------------------------
    // Terminal Logic (Super Admin)
    // ---------------------------------------------------------
    if (isTerminal) {
        // Fix for localhost: prevent double-rewriting if path already starts with /terminal
        if (hostname.startsWith('terminal')) {
            if (url.pathname === '/') {
                return NextResponse.rewrite(new URL('/terminal/tenants', req.url));
            }
            if (!url.pathname.startsWith('/terminal')) {
                return NextResponse.rewrite(new URL(`/terminal${url.pathname}`, req.url));
            }
        }

        // For localhost path-based access, just allow it through
        return response;
    }

    // ---------------------------------------------------------
    // Tenant Admin Logic
    // ---------------------------------------------------------
    if (isApp) {
        // Rewrite Logic
        // /       -> /admin (Dashboard)
        // /pages  -> /admin/pages

        // If URL is /login, we want to render app/(app)/login/page.tsx
        // The Rewrite Target should be /login (if it's in the root of (app)) OR /admin/login?

        if (url.pathname === '/') {
            return NextResponse.rewrite(new URL('/admin', req.url));
        }

        return response;
    }

    // ---------------------------------------------------------
    // Public Tenant Site Logic
    // ---------------------------------------------------------
    // Default to 'en' locale for now
    const locale = 'en';

    // Rewrite everything to (site)/[locale]
    // e.g. /about -> /en/about
    return NextResponse.rewrite(new URL(`/${locale}${url.pathname}`, req.url));
}
