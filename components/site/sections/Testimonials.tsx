'use client';

import { Section } from '@/types';

export default function Testimonials({ section }: { section: Section }) {
    const {
        title = 'Müşteri Deneyimleri',
        subtitle = 'Netspace ile dijital dönüşümünü tamamlayan markaların başarı hikayeleri',
        items = [
            {
                name: 'Selim Aydın',
                role: 'CEO @ TechSphere',
                quote: 'Netspace sayesinde dijital varlığımızı sıfırdan inşa ettik. Hız ve kullanım kolaylığı beklentilerimizin çok ötesinde.',
                avatar: 'https://i.pravatar.cc/150?u=selim'
            },
            {
                name: 'Ayşe Kaya',
                role: 'Kreatif Direktör',
                quote: 'Tasarım esnekliği ve sundukları modern bileşenler sayesinde web sitemiz artık çok daha profesyonel görünüyor.',
                avatar: 'https://i.pravatar.cc/150?u=ayse'
            },
            {
                name: 'Murat Yıldız',
                role: 'E-Ticaret Müdürü',
                quote: 'Envanter yönetimi ve site oluşturucu arasındaki kusursuz entegrasyon iş yükümüzü %50 azalttı.',
                avatar: 'https://i.pravatar.cc/150?u=murat'
            }
        ]
    } = section.content || {};

    const {
        backgroundColor = 'transparent',
        paddingTop = 'py-32',
        paddingBottom = 'py-32',
        containerWidth = 'boxed'
    } = section.styles || {};

    const containerClass = containerWidth === 'full' ? 'w-full px-6' : 'max-w-7xl mx-auto px-6';

    return (
        <section className={`${paddingTop} ${paddingBottom}`} style={{ backgroundColor }}>
            <div className={containerClass}>
                {(title || subtitle) && (
                    <div className="text-center mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {title && <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 mb-8 uppercase leading-none">{title}</h2>}
                        {subtitle && <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto">{subtitle}</p>}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {items.map((item: any, index: number) => (
                        <div
                            key={index}
                            className="group bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-100 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 border border-gray-50 flex flex-col justify-between hover:-translate-y-2"
                        >
                            <div>
                                <div className="flex gap-1.5 mb-10 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className="w-5 h-5 text-indigo-600 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-gray-600 text-lg font-medium leading-relaxed mb-12 italic relative">
                                    <span className="absolute -top-6 -left-4 text-6xl text-indigo-50 font-serif opacity-0 group-hover:opacity-100 transition-opacity">“</span>
                                    {item.quote}
                                </p>
                            </div>
                            <div className="flex items-center gap-5 pt-8 border-t border-gray-50">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-200 rounded-2xl rotate-6 group-hover:rotate-0 transition-transform"></div>
                                    <img
                                        src={item.avatar}
                                        alt={item.name}
                                        className="relative w-14 h-14 rounded-2xl object-cover ring-2 ring-white"
                                    />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 tracking-tight uppercase text-sm">{item.name}</h4>
                                    <p className="text-[10px] text-indigo-600 font-black tracking-widest uppercase mt-1 opacity-60">{item.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
