import React from 'react';
import { getNotifications } from '@/app/actions/notifications';
import { getAuthenticatedClient } from '@/app/actions/auth-helper';
import Sidebar from '@/components/admin/sidebar';

export default async function AdminSidebarFetcher() {
    const { tenant, modules, role, permissions } = await getAuthenticatedClient();
    const notifications = await getNotifications();

    return (
        <Sidebar
            tenantName={tenant.name}
            notificationCount={notifications.length}
            modules={modules}
            userRole={role}
            userPermissions={permissions}
        />
    );
}
