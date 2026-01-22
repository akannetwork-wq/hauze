import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <header className="h-20 border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
                        N
                    </div>
                    <span className="text-2xl font-black text-gray-900 tracking-tight">NETSPACE</span>
                </Link>
                <Link href="/" className="text-sm font-bold text-gray-600 hover:text-indigo-600">← Ana Sayfaya Dön</Link>
            </header>

            <main className="py-24 px-8 max-w-4xl mx-auto">
                <h1 className="text-5xl font-black text-gray-900 mb-8 tracking-tight">Hakkımızda</h1>
                <div className="prose prose-lg text-gray-600 font-medium leading-relaxed space-y-6">
                    <p>
                        Netspace, modern işletmelerin tüm ihtiyaçlarını tek bir çatı altında toplamayı hedefleyen
                        yeni nesil bir kurumsal yönetim platformudur.
                    </p>
                    <p>
                        Geleneksel ERP sistemlerinin karmaşıklığından uzak, kullanıcı dostu ve ölçeklenebilir
                        bir altyapı sunuyoruz. Hedefimiz, küçük ve orta ölçekli işletmelerin dijital
                        dönüşümünü en sancısız şekilde gerçekleştirmesini sağlamaktır.
                    </p>
                    <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 text-indigo-900">
                        <h3 className="text-xl font-black mb-2">Vizyonumuz</h3>
                        <p className="font-bold">
                            "Teknoloji ne kadar karmaşık olursa olsun, kullanımı bir o kadar basit olmalıdır."
                            felsefesiyle yola çıktık.
                        </p>
                    </div>
                </div>

                <div className="mt-20 pt-10 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-400 font-black uppercase tracking-widest">
                        Bu sayfa app/(main)/about klasörü altındadır.
                    </p>
                </div>
            </main>
        </div>
    );
}
