import Link from 'next/link';
import { getAccountingSummary } from '@/app/actions/accounting';

import AccountingActions from './components/accounting-actions';

export default async function AccountingContent() {
    const summary = await getAccountingSummary();

    return (
        <div className="animate-in fade-in duration-700">
            {/* Actions */}
            <AccountingActions />

            {/* Financial Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Link href="/admin/accounting/customers" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:border-indigo-100">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Alacak</div>
                    <div className="text-2xl font-black text-indigo-600 text-right">{summary.totalReceivables.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                </Link>
                <Link href="/admin/accounting/suppliers" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:border-red-100">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Borç</div>
                    <div className="text-2xl font-black text-red-600 text-right">{summary.totalPayables.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                </Link>
                <Link href="/admin/personnel/employees" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:border-orange-100">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Personel Ödemeleri</div>
                    <div className="text-2xl font-black text-orange-600 text-right">{(summary.totalPersonnelPayable || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                </Link>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:border-blue-100 bg-blue-50/10">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Net Finansal Değer (Equity)</div>
                    <div className="text-2xl font-black text-blue-600 text-right">{summary.netBalance?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                    <div className="text-[9px] text-gray-400 text-right font-bold mt-1">Varlık + Alacak - Tüm Borçlar</div>
                </div>
            </div>

            {/* Detailed Assets Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
                {/* Cash */}
                <Link href="/admin/accounting/safes" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-100 transition-all group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kasa</div>
                    </div>
                    <div className="text-xl font-black text-gray-900">{summary.totalCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL</div>
                </Link>

                {/* Bank */}
                <Link href="/admin/accounting/banks" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-100 transition-all group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Banka + KMH</div>
                    </div>
                    <div className="text-xl font-black text-gray-900">{summary.totalBankAvailable?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL</div>
                    <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-400 border-t border-gray-50 pt-2">
                        <span>Net: {summary.totalBank?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                        <span className="text-blue-500">KMH: {summary.totalBankKMH?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                    </div>
                </Link>

                {/* Credit Cards (Available) */}
                <Link href="/admin/accounting/credit-cards" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-purple-100 transition-all group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kart Limiti</div>
                    </div>
                    <div className="text-xl font-black text-gray-900">{summary.totalCreditCardsAvailable?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL</div>
                    <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-400 border-t border-gray-50 pt-2">
                        <span>L: {summary.totalCreditCardsLimit?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                        <span className="text-red-500">B: -{summary.totalCreditCards?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                    </div>
                </Link>

                {/* POS */}
                <Link href="/admin/accounting/definitions" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-cyan-100 transition-all group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">POS Hesapları</div>
                    </div>
                    <div className="text-xl font-black text-gray-900">{summary.totalPos.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL</div>
                </Link>

                {/* Checks */}
                <Link href="/admin/accounting/checks" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-amber-100 transition-all group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Çek Portföyü</div>
                    </div>
                    <div className="text-xl font-black text-gray-900">{summary.totalChecks.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL</div>
                </Link>

                {/* Purchasing Power / Liquidity Info */}
                <div className="bg-indigo-600 p-5 rounded-2xl shadow-xl shadow-indigo-100 flex flex-col justify-center">
                    <div className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Toplam Alım Gücü (Likidite)</div>
                    <div className="text-xl font-black text-white">
                        {summary.availableLiquidity?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
                    </div>
                    <div className="text-[8px] text-indigo-200 font-bold mt-1">Nakit + KMH + Kart Limitleri</div>
                </div>
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
