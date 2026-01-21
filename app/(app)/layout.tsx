import React from 'react';

// This is the Root Layout for the (app) group. 
// It should strictly handle Providers (Toast, QueryClient, etc).
// It should NOT render the Sidebar, because Login page shares this group.

export default function AppRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {children}
        </div>
    );
}
