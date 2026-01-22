import { Section } from '@/types';

export default function Hero({ section }: { section: Section }) {
    const { headline, subheadline, buttonText, buttonLink, image } = section.content;
    const { paddingTop = 'py-20', paddingBottom = 'py-20', backgroundColor = 'bg-white' } = section.styles || {};

    return (
        <section className={`${paddingTop} ${paddingBottom}`} style={{ backgroundColor }}>
            <div className="container mx-auto px-6 flex flex-col items-center text-center">
                {headline && (
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                        {headline}
                    </h1>
                )}
                {subheadline && (
                    <p className="text-xl text-gray-600 max-w-2xl mb-10">
                        {subheadline}
                    </p>
                )}
                {buttonText && (
                    <a
                        href={buttonLink || '#'}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        {buttonText}
                    </a>
                )}
                {image && (
                    <img
                        src={image}
                        alt={headline || 'Hero Image'}
                        className="mt-12 rounded-2xl shadow-2xl max-w-4xl w-full object-cover h-[400px]"
                    />
                )}
            </div>
        </section>
    );
}
