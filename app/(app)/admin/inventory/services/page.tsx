import Link from 'next/link';

export default function ServicesPlaceholderPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto text-center space-y-8 mt-12">
            <div className="space-y-4">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-sm">
                    🛠️
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Hizmet Yönetimi</h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                    İşçilik, montaj, nakliye ve servis gibi kalemlerinizi burada yönetebileceksiniz.
                    Bu bölüm şu anda geliştirilme aşamasındadır.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 mb-1">⏰ İşçilik Takibi</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">Personel saatlik maliyetleri ve üretim sürelerini baz alan hesaplamalar.</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 mb-1">🚛 Operasyonel Giderler</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">Nakliye ve dış hizmet giderlerinin ürün maliyetine yansıtılması.</p>
                </div>
            </div>

            <div className="pt-8">
                <Link
                    href="/admin/inventory"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 font-medium transition-colors"
                >
                    ← Dashboard'a Dön
                </Link>
            </div>
        </div>
    );
}
