'use client';

import { Section } from '@/types';

export default function Contact({ section }: { section: Section }) {
    const {
        title = 'Get in Touch',
        subtitle = 'We would love to hear from you',
        email = 'hello@example.com',
        phone = '+1 (555) 123-4567',
        address = '123 Business St, Suite 100, City, Country',
        showForm = true,
        buttonText = 'Send Message'
    } = section.content || {};

    const {
        backgroundColor = 'transparent',
        paddingTop = 'py-16',
        paddingBottom = 'py-16',
        containerWidth = 'boxed'
    } = section.styles || {};

    const containerClass = containerWidth === 'full' ? 'w-full px-4' : 'max-w-7xl mx-auto px-4';

    return (
        <section className={`${paddingTop} ${paddingBottom}`} style={{ backgroundColor }}>
            <div className={containerClass}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 mb-6">{title}</h2>
                        <p className="text-lg text-gray-600 mb-12">{subtitle}</p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Email Us</h4>
                                    <p className="text-gray-600 font-medium">{email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Call Us</h4>
                                    <p className="text-gray-600 font-medium">{phone}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Visit Us</h4>
                                    <p className="text-gray-600 font-medium">{address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {showForm && (
                        <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-xl border border-gray-100">
                            <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">First Name</label>
                                        <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Last Name</label>
                                        <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                                    <input type="email" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Message</label>
                                    <textarea rows={4} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all resize-none"></textarea>
                                </div>
                                <button className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all hover:-translate-y-1">
                                    {buttonText}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
