import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <Toaster position="top-right" />
            <main className="flex-1 w-full max-w-lg mx-auto p-4 sm:p-8 animate-in fade-in duration-700">
                {children}
            </main>
        </div>
    );
}
