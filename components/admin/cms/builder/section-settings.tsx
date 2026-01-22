'use client';

import { Section, ProductCategory } from '@/types';
import { useState, useEffect } from 'react';
import { getCategories } from '@/app/actions/inventory';

interface SectionSettingsProps {
    section: Section;
    onUpdate: (updates: Partial<Section>) => void;
}

export default function SectionSettings({ section, onUpdate }: SectionSettingsProps) {
    const [categories, setCategories] = useState<ProductCategory[]>([]);

    useEffect(() => {
        const fetchCats = async () => {
            const data = await getCategories('product');
            setCategories(data);
        };
        fetchCats();
    }, []);

    const handleContentChange = (key: string, value: any) => {
        onUpdate({
            content: { ...section.content, [key]: value }
        });
    };

    const handleStyleChange = (key: string, value: any) => {
        onUpdate({
            styles: { ...section.styles, [key]: value }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Common Styles */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Layout & Style</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1.5">Background</label>
                        <select
                            value={section.styles?.backgroundColor || 'transparent'}
                            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="transparent">Transparent</option>
                            <option value="#ffffff">White</option>
                            <option value="#f9fafb">Light Gray</option>
                            <option value="#1e1b4b">Dark Indigo</option>
                            <option value="#000000">Black</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1.5">Width</label>
                        <select
                            value={section.styles?.containerWidth || 'boxed'}
                            onChange={(e) => handleStyleChange('containerWidth', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="boxed">Boxed</option>
                            <option value="full">Full Width</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1.5">Padding Top</label>
                        <select
                            value={section.styles?.paddingTop || 'py-16'}
                            onChange={(e) => handleStyleChange('paddingTop', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="py-0">None</option>
                            <option value="py-8">Small (32px)</option>
                            <option value="py-16">Medium (64px)</option>
                            <option value="py-24">Large (96px)</option>
                            <option value="py-32">X-Large (128px)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1.5">Padding Bottom</label>
                        <select
                            value={section.styles?.paddingBottom || 'py-16'}
                            onChange={(e) => handleStyleChange('paddingBottom', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="py-0">None</option>
                            <option value="py-8">Small (32px)</option>
                            <option value="py-16">Medium (64px)</option>
                            <option value="py-24">Large (96px)</option>
                            <option value="py-32">X-Large (128px)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Controls based on Type */}
            <div className="space-y-6 border-t border-gray-100 pt-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Content Settings</h4>

                {/* HERO EDITOR */}
                {section.type === 'hero' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1.5 font-bold">Headline</label>
                            <input
                                value={section.content.headline || ''}
                                onChange={(e) => handleContentChange('headline', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1.5 font-bold">Subheadline</label>
                            <textarea
                                value={section.content.subheadline || ''}
                                onChange={(e) => handleContentChange('subheadline', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 min-h-[80px]"
                            />
                        </div>
                    </div>
                )}

                {/* PRODUCT GRID EDITOR */}
                {section.type === 'product-grid' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1.5 font-bold">Title</label>
                            <input
                                value={section.content.title || ''}
                                onChange={(e) => handleContentChange('title', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1.5 font-bold">Category</label>
                            <select
                                value={section.content.categoryId || ''}
                                onChange={(e) => handleContentChange('categoryId', e.target.value || null)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-xs outline-none"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1.5 font-bold">Product Limit</label>
                            <input
                                type="number"
                                value={section.content.limit || 4}
                                onChange={(e) => handleContentChange('limit', parseInt(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-sm"
                            />
                        </div>
                    </div>
                )}

                {/* FAQ EDITOR */}
                {section.type === 'faq' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1.5 font-bold">Section Title</label>
                            <input
                                value={section.content.title || ''}
                                onChange={(e) => handleContentChange('title', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-sm"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-xs text-gray-600 mb-1.5 font-bold uppercase tracking-tighter">Items</label>
                            {(section.content.items || []).map((item: any, i: number) => (
                                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100 relative group">
                                    <input
                                        value={item.question}
                                        onChange={(e) => {
                                            const newItems = [...section.content.items];
                                            newItems[i] = { ...item, question: e.target.value };
                                            handleContentChange('items', newItems);
                                        }}
                                        placeholder="Question"
                                        className="w-full bg-transparent font-bold text-xs mb-2 outline-none"
                                    />
                                    <textarea
                                        value={item.answer}
                                        onChange={(e) => {
                                            const newItems = [...section.content.items];
                                            newItems[i] = { ...item, answer: e.target.value };
                                            handleContentChange('items', newItems);
                                        }}
                                        placeholder="Answer"
                                        className="w-full bg-transparent text-xs outline-none resize-none"
                                        rows={2}
                                    />
                                    <button
                                        onClick={() => {
                                            const newItems = section.content.items.filter((_: any, idx: number) => idx !== i);
                                            handleContentChange('items', newItems);
                                        }}
                                        className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    const items = section.content.items || [];
                                    handleContentChange('items', [...items, { question: '', answer: '' }]);
                                }}
                                className="w-full py-2 border border-dashed border-gray-200 rounded-lg text-[10px] font-bold text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all uppercase"
                            >
                                + Add FAQ Item
                            </button>
                        </div>
                    </div>
                )}

                {/* TESTIMONIALS EDITOR */}
                {section.type === 'testimonials' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                const items = section.content.items || [];
                                handleContentChange('items', [...items, { name: 'Full Name', role: 'Role', quote: 'Great experience!', avatar: 'https://i.pravatar.cc/150' }]);
                            }}
                            className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                        >
                            + Add Testimonial
                        </button>
                        <p className="text-[10px] text-gray-400 text-center italic">Manage individual testimonial tiles directly here.</p>
                    </div>
                )}

                {/* CONTACT EDITOR */}
                {section.type === 'contact' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1.5 font-bold">Email</label>
                            <input
                                value={section.content.email || ''}
                                onChange={(e) => handleContentChange('email', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1.5 font-bold">Address</label>
                            <textarea
                                value={section.content.address || ''}
                                onChange={(e) => handleContentChange('address', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-sm"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
