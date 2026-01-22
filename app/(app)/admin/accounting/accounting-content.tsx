import Link from 'next/link';
import { getAccountingSummary } from '@/app/actions/accounting';

export default async function AccountingContent() {
    const summary = await getAccountingSummary();

    return (
        <div className="animate-in fade-in duration-700">
            {/* Financial Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:border-indigo-100">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Alacak</div>
                    <div className="text-2xl font-black text-indigo-600">{summary.totalReceivables.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:border-red-100">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Borç</div>
                    <div className="text-2xl font-black text-red-600">{summary.totalPayables.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:border-emerald-100">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kasa Durumu</div>
                    <div className="text-2xl font-black text-emerald-600">{summary.totalCash.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:border-gray-200 bg-gray-50/30">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Net Durum</div>
                    <div className="text-2xl font-black text-gray-900 border-t border-gray-100 pt-1 mt-1">{(summary.totalReceivables - summary.totalPayables + summary.totalCash).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {/* Customers Card */}
                <Link href="/admin/accounting/customers" className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900">Müşteriler</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">Satış yaptığınız kişi ve kurumların cari hesaplarını takip edin.</p>
                </Link>

                {/* Suppliers Card */}
                <Link href="/admin/accounting/suppliers" className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900">Tedarikçiler</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">Mal ve hizmet aldığınız firmaların ödemelerini ve borçlarını yönetin.</p>
                </Link>

                {/* General Ledger Card */}
                <Link href="/admin/accounting/ledger" className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900">Kasa & Banka</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">Nakit ve banka hesaplarınızdaki para hareketlerini izleyin.</p>
                </Link>
            </div>

            {/* Active Contacts this Month */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h3 className="text-xl font-black text-gray-900">Bu Ay İşlem Gören Cariler</h3>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white border border-gray-100 px-3 py-1 rounded-full">En Aktif 10 Cari</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Firma / İsim</th>
                                <th className="px-8 py-5">Tür</th>
                                <th className="px-8 py-5 text-right">Güncel Bakiye</th>
                                <th className="px-8 py-5 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {summary.activeContacts.map((c: any) => (
                                <tr key={c.id} className="text-sm hover:bg-gray-50 transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{c.company_name || `${c.first_name} ${c.last_name}`}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${c.type === 'customer' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            }`}>
                                            {c.type === 'customer' ? 'Müşteri' : 'Tedarikçi'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black">
                                        <span className={c.balance < 0 ? 'text-red-600' : 'text-emerald-600'}>
                                            {c.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <Link
                                            href={`/admin/accounting/${c.type === 'customer' ? 'customers' : 'suppliers'}/${c.id}`}
                                            className="p-3 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all inline-block"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {summary.activeContacts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">Bu ay henüz bir işlem kaydı bulunmuyor.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
