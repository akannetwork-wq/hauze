'use client';

import { Section, Product } from '@/types';
import { useState, useEffect } from 'react';
import { getProducts } from '@/app/actions/inventory';

export default function ProductGrid({ section }: { section: Section }) {
    const {
        title = 'Öne Çıkan Ürünler',
        subtitle = 'En yeni koleksiyonlarımızı ve popüler ürünlerimizi keşfedin',
        limit = 4,
        categoryId = null,
        showPrice = true,
        buttonText = 'Ürünü İncele'
    } = section.content || {};

    const {
        backgroundColor = 'transparent',
        paddingTop = 'py-24',
        paddingBottom = 'py-24',
        containerWidth = 'boxed'
    } = section.styles || {};

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await getProducts({
                    limit,
                    categoryId: categoryId || undefined,
                    status: 'active'
                });
                setProducts(data);
            } catch (error) {
                console.error('Failed to fetch products for section:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [limit, categoryId]);

    const containerClass = containerWidth === 'full' ? 'w-full px-6' : 'max-w-7xl mx-auto px-6';

    return (
        <section className={`${paddingTop} ${paddingBottom}`} style={{ backgroundColor }}>
            <div className={containerClass}>
                {(title || subtitle) && (
                    <div className="text-center mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
                        {title && <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 mb-6 uppercase leading-tight">{title}</h2>}
                        {subtitle && <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto">{subtitle}</p>}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {[...Array(limit)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-100 aspect-[4/5] rounded-[2.5rem] mb-6 shadow-inner"></div>
                                <div className="h-6 bg-gray-100 rounded-xl w-3/4 mb-3 mx-auto"></div>
                                <div className="h-4 bg-gray-100 rounded-xl w-1/2 mx-auto"></div>
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {products.map((product) => (
                            <div key={product.id} className="group relative flex flex-col">
                                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] bg-gray-50 flex items-center justify-center p-4 shadow-xl shadow-gray-100 group-hover:shadow-2xl group-hover:shadow-indigo-100 transition-all duration-700">
                                    <img
                                        src={product.cover_image || '/placeholder-product.png'}
                                        alt={product.title}
                                        className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="absolute bottom-8 left-8 right-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                                        <button className="w-full py-4 bg-white text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-gray-50 active:scale-95 transition-all">
                                            {buttonText}
                                        </button>
                                    </div>
                                    {product.type === 'consumable' && (
                                        <div className="absolute top-6 right-6 px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                            SARF MALZEME
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 text-center px-4">
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">
                                        <a href={`/products/${product.slug}`}>
                                            <span aria-hidden="true" className="absolute inset-0" />
                                            {product.title}
                                        </a>
                                    </h3>
                                    <div className="mt-2 flex items-center justify-center gap-4">
                                        {showPrice && product.prices && product.prices.length > 0 && (
                                            <p className="text-lg font-black text-gray-400 group-hover:text-indigo-600 transition-colors">
                                                {product.prices[0].amount.toLocaleString('tr-TR')} <span className="text-[10px] tracking-widest opacity-60 font-bold">{product.prices[0].currency}</span>
                                            </p>
                                        )}
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-indigo-200 transition-colors"></div>
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-indigo-300 transition-colors">{product.sku}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-gray-50/50 rounded-[4rem] border-4 border-dashed border-gray-100 animate-in fade-in duration-1000">
                        <div className="text-4xl mb-6 opacity-30">📦</div>
                        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-sm">Ürün Bulunamadı</p>
                    </div>
                )}
            </div>
        </section>
    );
}
