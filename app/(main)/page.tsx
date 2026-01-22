import React from 'react';
import Link from 'next/link';

export default function MainLandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Simple Premium Header */}
            <header className="h-20 border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
                        N
                    </div>
                    <span className="text-2xl font-black text-gray-900 tracking-tight">NETSPACE</span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
                    <Link href="/features" className="hover:text-indigo-600 transition-colors">Özellikler</Link>
                    <Link href="/pricing" className="hover:text-indigo-600 transition-colors">Fiyatlandırma</Link>
                    <Link href="/about" className="hover:text-indigo-600 transition-colors">Hakkımızda</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className="px-6 py-2.5 rounded-2xl bg-gray-50 text-gray-900 font-bold text-sm hover:bg-gray-100 transition-all"
                    >
                        Giriş Yap
                    </Link>
                    <Link
                        href="/register"
                        className="px-6 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        Hemen Başla
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main>
                <section className="py-24 px-8 max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-widest mb-8">
                        ✨ Geleceğin İşletim Sistemi
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter mb-8 leading-[0.9]">
                        İşletmenizi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Tek Noktadan</span> Yönetin.
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
                        Muhasebe, envanter, personel ve depo yönetimini tek bir platformda birleştirdik.
                        Karmaşayı bitirin, verimliliği artırın.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="w-full sm:w-auto px-8 py-4 rounded-[2rem] bg-indigo-600 text-white font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95">
                            Ücretsiz Deneyin
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 rounded-[2rem] bg-white border-2 border-gray-100 text-gray-900 font-black text-lg hover:bg-gray-50 transition-all hover:border-gray-200">
                            Tanıtım Videosu
                        </button>
                    </div>
                </section>

                {/* Main Site Content Placeholder */}
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-8 text-center">
                        <h2 className="text-3xl font-black text-gray-900 mb-4">Ana Site Özel Alanı</h2>
                        <p className="text-gray-500 font-medium italic">
                            Bu alan (app/(main)) klasörü altındadır ve sadece root domain (localhost / netspace.com.tr) üzerinden erişilebilir.
                            Burayı dilediğiniz gibi kapsamlı bir siteye çevirebilirsiniz.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
