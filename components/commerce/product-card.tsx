'use client';

import { useCart } from './cart-provider';

interface ProductCardProps {
    product: {
        sku: string;
        amount: number;
        currency: string;
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();

    return (
        <div className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
            <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400 font-mono text-xs">
                {/* Image Placeholder */}
                [Image: {product.sku}]
            </div>
            <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1">{product.sku}</h3>
                <p className="text-gray-600 mb-4">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.amount)}
                </p>
                <button
                    onClick={() => addToCart({ sku: product.sku, amount: product.amount, currency: product.currency })}
                    className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-medium hover:bg-indigo-700 transition-colors opacity-0 group-hover:opacity-100"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
}
