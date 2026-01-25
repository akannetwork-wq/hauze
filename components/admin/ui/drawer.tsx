'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
    const [visible, setVisible] = useState(false);
    const [animating, setAnimating] = useState(false);

    // Handle mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle open/close with animation
    useEffect(() => {
        if (isOpen) {
            // Opening: first make visible, then animate in
            setVisible(true);
            // Use timeout instead of rAF for more reliable animation trigger
            const animateIn = setTimeout(() => {
                setAnimating(true);
            }, 10);
            document.body.style.overflow = 'hidden';
            return () => clearTimeout(animateIn);
        } else if (visible) {
            // Closing: first animate out, then hide
            setAnimating(false);
            document.body.style.overflow = 'unset';
            const hideTimer = setTimeout(() => {
                setVisible(false);
            }, 300); // Match CSS transition duration
            return () => clearTimeout(hideTimer);
        }
    }, [isOpen, visible]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Handle Escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!mounted || !visible) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop with fade animation */}
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${animating ? 'opacity-20' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Drawer Content with slide animation */}
            <aside
                className={`relative w-full ${sizeClasses[size]} bg-background h-screen shadow-2xl flex flex-col transform transition-transform duration-300 ease-out will-change-transform ${animating ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="py-4 px-8 border-b border-border flex items-center justify-between bg-background sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">{title}</h2>
                        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-card">
                    {children}
                </div>
            </aside>
        </div>,
        document.body
    );
}
