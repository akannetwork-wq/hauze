
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export const config = {
    matcher: ['/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)'],
};

export default async function middleware(req: NextRequest) {
    // 1. Refresh Session & Get User
    // We use 'updateSession' pattern from Supabase SSR docs
    const { response, user } = await updateSession(req);

    const url = req.nextUrl;
    const hostname = req.headers.get('host')!;

    // TODO: Real tenant resolution via API/Redis
    // For dev: map localhost:3000 to a default tenant
    // For dev: map localhost:3000 to a default tenant
    // Also allow path-based access on localhost for convenience
    const isLocalhost = hostname.includes('localhost');
    const isTerminal = hostname.startsWith('terminal') || (isLocalhost && url.pathname.startsWith('/terminal'));
    // If localhost/admin or localhost/login, treat as App (Tenant Admin)
    // Note: This might conflict if we have a public page called "admin", but unlikely.
    const isApp = hostname.startsWith('app') || (isLocalhost && (url.pathname.startsWith('/admin') || url.pathname.startsWith('/login')));

    // ---------------------------------------------------------
    // Terminal Logic (Super Admin)
    // ---------------------------------------------------------
    if (isTerminal) {
        if (url.pathname.startsWith('/login') && user) {
            return NextResponse.redirect(new URL('/terminal', req.url));
        }
        // Protect /terminal route (but allow /login)
        // Note: Our structure is /terminal/... BUT via rewrite. 
        // The incoming URL is /dashboard, rewritten to /terminal/dashboard.
        // Auth check should happen on the rewritten path logic or here.
        // Since we rewrite, we must ensure we don't rewrite unauthed users to protected routes.

        // Simplification: We rewrite first, then App Router layout checks auth?
        // No, Middleware is better for redirects.

        // If not logged in and not on login page -> Redirect to login
        if (!user && !url.pathname.startsWith('/login')) {
            const loginUrl = new URL('/login', req.url);
            // loginUrl.searchParams.set('next', url.pathname);
            return NextResponse.redirect(loginUrl);
        }


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
        // If logged in, redirect away from login page
        if (url.pathname.startsWith('/login') && user) {
            return NextResponse.redirect(new URL('/admin', req.url));
        }

        // If not logged in and not on login page -> Redirect to login
        if (!user && !url.pathname.startsWith('/login')) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        // Rewrite Logic
        // /       -> /admin (Dashboard)
        // /pages  -> /admin/pages
        // /login  -> /login (No rewrite needed if file is at app/login?? Wait.)

        // Our structure:
        // app/(app)/admin/... -> Mapped to /admin
        // app/(app)/login/... -> Mapped to /login

        // If URL is /login, we want to render app/(app)/login/page.tsx
        // The Rewrite Target should be /login (if it's in the root of (app)) OR /admin/login?

        // In our file structure:
        // app/(app)/login/page.tsx
        // app/(app)/admin/page.tsx

        // Because they are in a Route Group (app), they are at the ROOT of the URL space effectively.
        // So /login maps to app/(app)/login/page.tsx automatically?
        // NO. Route Groups don't add segments.
        // So app/(app)/login/page.tsx matches URL /login.
        // app/(app)/admin/page.tsx matches URL /admin.

        // So if user visits app.netspace.com/login:
        // -> Matches /login
        // -> Next.js finds app/(app)/login/page.tsx.
        // -> Valid.

        // If user visits app.netspace.com/ (root):
        // -> Matches /
        // -> We want to show Dashboard.
        // -> Rewrite / -> /admin ?
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
