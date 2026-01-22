import { Section } from '@/types';

export default function Features({ section }: { section: Section }) {
    const { title, subtitle, items = [] } = section.content;
    const { paddingTop = 'py-20', paddingBottom = 'py-20', backgroundColor = 'bg-gray-50' } = section.styles || {};

    return (
        <section className={`${paddingTop} ${paddingBottom}`} style={{ backgroundColor }}>
            <div className="container mx-auto px-6">
                {(title || subtitle) && (
                    <div className="text-center mb-16">
                        {title && <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>}
                        {subtitle && <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-10">
                    {items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-3xl mb-4">{item.icon || '✨'}</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="col-span-3 text-center py-10 text-gray-400 italic">
                            No features added yet.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
