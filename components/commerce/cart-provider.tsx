'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type CartItem = {
    sku: string;
    amount: number;
    currency: string;
    quantity: number;
};

type CartContextType = {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'>) => void;
    removeFromCart: (sku: string) => void;
    clearCart: () => void;
    total: number;
    isOpen: boolean;
    toggleCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem('netspace_cart');
        if (saved) setItems(JSON.parse(saved));
    }, []);

    // Save to local storage
    useEffect(() => {
        localStorage.setItem('netspace_cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (product: Omit<CartItem, 'quantity'>) => {
        setItems(prev => {
            const existing = prev.find(i => i.sku === product.sku);
            if (existing) {
                return prev.map(i => i.sku === product.sku ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsOpen(true);
    };

    const removeFromCart = (sku: string) => {
        setItems(prev => prev.filter(i => i.sku !== sku));
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    const toggleCart = () => setIsOpen(!isOpen);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total, isOpen, toggleCart }}>
            {children}
            {/* Simple Cart Sidebar Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/50" onClick={toggleCart} />
                    <div className="relative w-96 bg-white h-full shadow-2xl p-6 overflow-y-auto transform transition-transform">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Your Cart</h2>
                            <button onClick={toggleCart} className="text-gray-500 hover:text-gray-800">Close</button>
                        </div>

                        <div className="space-y-4">
                            {items.map(item => (
                                <div key={item.sku} className="flex justify-between items-center border-b pb-4">
                                    <div>
                                        <div className="font-bold">{item.sku}</div>
                                        <div className="text-sm text-gray-500">
                                            {item.quantity} x {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.amount)}
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.sku)} className="text-red-500 text-sm">Remove</button>
                                </div>
                            ))}
                            {items.length === 0 && <p className="text-gray-500 text-center py-8">Your cart is empty.</p>}
                        </div>

                        {items.length > 0 && (
                            <div className="mt-8 pt-4 border-t">
                                <div className="flex justify-between font-bold text-lg mb-4">
                                    <span>Total</span>
                                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: items[0]?.currency || 'USD' }).format(total)}</span>
                                </div>
                                <button className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 font-bold">
                                    Checkout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
};
