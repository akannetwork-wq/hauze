import React from 'react';

export function SidebarSkeleton() {
    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col h-screen sticky top-0 animate-pulse">
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-2xl"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                </div>
            </div>
            <nav className="flex-1 space-y-3">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded-2xl w-full"></div>
                ))}
            </nav>
        </aside>
    );
}

export function HeaderSkeleton() {
    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-40 animate-pulse">
            <div className="h-10 bg-gray-100 rounded-2xl w-64"></div>
            <div className="flex items-center gap-6">
                <div className="w-10 h-10 bg-gray-100 rounded-2xl"></div>
                <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
                    <div className="w-24 h-4 bg-gray-100 rounded-full"></div>
                    <div className="w-10 h-10 bg-gray-200 rounded-2xl shadow-lg ring-4 ring-white"></div>
                </div>
            </div>
        </header>
    );
}

export function PageSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-gray-200 rounded-2xl w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-40 bg-gray-100 rounded-[2rem]"></div>
                <div className="h-40 bg-gray-100 rounded-[2rem]"></div>
                <div className="h-40 bg-gray-100 rounded-[2rem]"></div>
            </div>
            <div className="h-80 bg-gray-50 rounded-[2rem]"></div>
        </div>
    );
}
