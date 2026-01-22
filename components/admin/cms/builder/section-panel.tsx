import { SectionType } from '@/types';

interface SectionTemplate {
    type: SectionType;
    label: string;
    description: string;
    icon: string;
    category: 'basic' | 'content' | 'commerce' | 'advanced';
}

const SECTION_TEMPLATES: SectionTemplate[] = [
    { type: 'hero', label: 'Hero Banner', description: 'Large headline with background', icon: '🎯', category: 'basic' },
    { type: 'text', label: 'Rich Text', description: 'Simple text content', icon: '📝', category: 'basic' },
    { type: 'cta', label: 'Call to Action', description: 'Button with catchy title', icon: '📢', category: 'basic' },
    { type: 'features', label: 'Features Grid', description: 'List of features with icons', icon: '✨', category: 'content' },
    { type: 'gallery', label: 'Image Gallery', description: 'Grid of clickable images', icon: '🖼️', category: 'content' },
    { type: 'faq', label: 'FAQ Section', description: 'Accordion of questions', icon: '❓', category: 'content' },
    { type: 'product-grid', label: 'Product Grid', description: 'Dynamic list of products', icon: '🛍️', category: 'commerce' },
    { type: 'testimonials', label: 'Testimonials', description: 'Customer quotes and faces', icon: '🗣️', category: 'content' },
    { type: 'contact', label: 'Contact Form', description: 'Easy reach out section', icon: '📧', category: 'advanced' },
    { type: 'stats', label: 'Stats/Counters', description: 'Numbers that impress', icon: '📊', category: 'advanced' },
];

export default function SectionPanel({ onAdd }: { onAdd: (type: SectionType) => void }) {
    const categories = Array.from(new Set(SECTION_TEMPLATES.map(t => t.category)));

    return (
        <div className="space-y-8">
            {categories.map(category => (
                <div key={category}>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-b border-gray-100 pb-2">
                        {category}
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5">
                        {SECTION_TEMPLATES.filter(t => t.category === category).map((template) => (
                            <button
                                key={template.type}
                                onClick={() => onAdd(template.type)}
                                className="flex items-center gap-3 p-3 text-left border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-white hover:shadow-sm transition-all group"
                            >
                                <div className="text-xl bg-gray-50 p-2 rounded-lg group-hover:bg-indigo-50 transition-all">
                                    {template.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-900 text-xs group-hover:text-indigo-600 transition-colors">
                                        {template.label}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                                        {template.description}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
