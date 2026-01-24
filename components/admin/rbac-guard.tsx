import { getAuthenticatedClient } from '@/app/actions/auth-helper';
import { redirect } from 'next/navigation';
import React from 'react';

interface Props {
    moduleKey: string;
    children: React.ReactNode;
}

/**
 * ModuleGuard: A Server Component that wraps protected module layouts or pages.
 * It verifies if the current user has access to the specified moduleKey.
 * If not, it redirects to the first available authorized module.
 */
export default async function ModuleGuard({ moduleKey, children }: Props) {
    const { role, permissions, employee } = await getAuthenticatedClient();

    // Super Admin bypasses all checks
    if (role === 'super_admin') {
        return <>{children}</>;
    }

    // Role-based check
    if (permissions[moduleKey] === true) {
        return <>{children}</>;
    }

    // Personnel Portal Check
    // If the user has an employee record and we are NOT in the portal, 
    // we might want to redirect them to /me if they have NO admin modules.
    const hasAdminAccess = Object.values(permissions).some(v => v === true);

    if (employee && !hasAdminAccess) {
        redirect('/me');
    }

    // Unauthorized access: Smart Redirect
    // Find the first module the user HAS access to
    const fallbackOrder = ['dashboard', 'accounting', 'orders', 'personnel', 'inventory', 'wms', 'pages'];
    const firstAvailable = fallbackOrder.find(key => permissions[key] === true);

    if (firstAvailable) {
        const path = firstAvailable === 'dashboard' ? '/admin' : `/admin/${firstAvailable}`;

        // Prevent infinite redirect loop
        if (path === `/admin/${moduleKey}` || (firstAvailable === 'dashboard' && moduleKey === 'dashboard')) {
            // If we are already at the "firstAvailable" and still failing, 
            // it means something is wrong or permissions are empty.
            return <div className="p-8 text-center text-red-500 font-bold">Erişim Yetkiniz Yok.</div>;
        }

        redirect(path);
    }

    // If account belongs to an employee, final fallback is portal
    if (employee) {
        redirect('/me');
    }

    // If NO modules are allowed, show error
    return <div className="p-8 text-center text-red-500 font-bold">Herhangi bir modüle erişim yetkiniz bulunmuyor.</div>;
}
