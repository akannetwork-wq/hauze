import { Section } from '@/types';
import Hero from './Hero';
import Features from './Features';
import ProductGrid from './ProductGrid';
import FAQ from './FAQ';
import Testimonials from './Testimonials';
import Contact from './Contact';

export const SECTION_COMPONENTS: Record<string, React.FC<{ section: Section }>> = {
    'hero': Hero,
    'features': Features,
    'product-grid': ProductGrid,
    'faq': FAQ,
    'testimonials': Testimonials,
    'contact': Contact,
};

export default function SectionRenderer({ section }: { section: Section }) {
    const Component = SECTION_COMPONENTS[section.type];
    if (!Component) {
        return (
            <div className="p-10 border border-dashed border-red-200 bg-red-50 text-red-500 rounded-lg text-center font-bold">
                ⚠️ Component for section type <span className="underline">{section.type}</span> not found.
            </div>
        );
    }
    return <Component section={section} />;
}
