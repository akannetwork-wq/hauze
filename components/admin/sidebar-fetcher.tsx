import React from 'react';
import { getCurrentContext } from '@/app/actions/tenant-context';
import { getNotifications } from '@/app/actions/notifications';
import Sidebar from '@/components/admin/sidebar';

export default async function AdminSidebarFetcher() {
    const context = await getCurrentContext();
    const notifications = await getNotifications();

    if (!context) return null;

    return (
        <Sidebar
            tenantName={context.tenant.name}
            notificationCount={notifications.length}
            modules={context.modules}
        />
    );
}
