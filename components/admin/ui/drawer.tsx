'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    subtitle?: string;
    size?: 'md' | 'lg' | 'xl' | '2xl';
}

export default function Drawer({ isOpen, onClose, title, subtitle, children, size = 'xl' }: DrawerProps) {
    const sizeClasses = {
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl'
    };
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <aside className={`relative w-full ${sizeClasses[size]} bg-white h-screen shadow-2xl flex flex-col`}>
                {/* Header */}
                <div className="py-4 px-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
                        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all border border-gray-100"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                    {children}
                </div>
            </aside>
        </div>,
        document.body
    );
}
