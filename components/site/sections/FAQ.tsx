'use client';

import { Section } from '@/types';
import { useState } from 'react';

export default function FAQ({ section }: { section: Section }) {
    const {
        title = 'Sıkça Sorulan Sorular',
        subtitle = 'Hizmetlerimiz ve süreçlerimiz hakkında merak edilenler',
        items = [
            { question: 'Ödeme yöntemleriniz nelerdir?', answer: 'Tüm kredi kartları, havale ve EFT ile ödeme kabul ediyoruz.' },
            { question: 'Teslimat süresi ne kadar?', answer: 'Siparişleriniz genellikle 24-48 saat içerisinde kargoya teslim edilmektedir.' },
            { question: 'İade politikanız nasıldır?', answer: 'Ürünlerimizden memnun kalmazsanız 14 gün içerisinde koşulsuz iade edebilirsiniz.' }
        ]
    } = section.content || {};

    const {
        backgroundColor = 'transparent',
        paddingTop = 'py-24',
        paddingBottom = 'py-24',
        containerWidth = 'boxed'
    } = section.styles || {};

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const containerClass = containerWidth === 'full' ? 'w-full px-6' : 'max-w-4xl mx-auto px-6';

    return (
        <section className={`${paddingTop} ${paddingBottom}`} style={{ backgroundColor }}>
            <div className={containerClass}>
                {(title || subtitle) && (
                    <div className="text-center mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
                        {title && <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 mb-6 uppercase leading-tight">{title}</h2>}
                        {subtitle && <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto">{subtitle}</p>}
                    </div>
                )}

                <div className="space-y-6">
                    {items.map((item: any, index: number) => (
                        <div
                            key={index}
                            className={`group border-none rounded-[2rem] overflow-hidden transition-all duration-500 ${openIndex === index ? 'bg-white shadow-2xl shadow-indigo-100 ring-1 ring-indigo-50' : 'bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-gray-100 hover:ring-1 hover:ring-gray-100'}`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex justify-between items-center p-8 md:p-10 text-left transition-all"
                            >
                                <span className={`text-lg md:text-xl font-black tracking-tight transition-colors duration-300 ${openIndex === index ? 'text-indigo-600' : 'text-gray-900'}`}>
                                    {item.question}
                                </span>
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ${openIndex === index ? 'bg-indigo-600 text-white rotate-180' : 'bg-white text-gray-400'}`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                            <div
                                className={`transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 invisible'}`}
                            >
                                <div className="p-8 md:p-10 pt-0 text-gray-500 text-lg font-medium leading-relaxed">
                                    <div className="pt-6 border-t border-indigo-50/50">
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
