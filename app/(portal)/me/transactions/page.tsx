import { getAuthenticatedClient } from '@/app/actions/auth-helper';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronLeftIcon,
    ArrowUpCircleIcon,
    ArrowDownCircleIcon
} from '@heroicons/react/24/solid';

export const dynamic = 'force-dynamic';

export default async function PersonnelTransactionsPage() {
    const { supabase, employee } = await getAuthenticatedClient();

    if (!employee) {
        redirect('/admin');
    }

    // Fetch detailed transactions
    const { data: ledger } = await supabase
        .from('personnel_transactions')
        .select('*')
        .eq('employee_id', employee.id)
        .order('date', { ascending: false });

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/me" className="w-12 h-12 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                    <ChevronLeftIcon className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Ödemeler & Avanslar</h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tüm Finansal Hareketler</p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {ledger?.map((tx: any) => (
                    <div key={tx.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${['earning', 'bonus', 'payment'].includes(tx.type) ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {['earning', 'bonus', 'payment'].includes(tx.type) ? (
                                    <ArrowUpCircleIcon className="w-7 h-7" />
                                ) : (
                                    <ArrowDownCircleIcon className="w-7 h-7" />
                                )}
                            </div>
                            <div>
                                <div className="font-black text-gray-900 capitalize">{tx.type === 'earning' ? 'Hakediş' : tx.type === 'advance' ? 'Avans' : tx.type === 'payment' ? 'Ödeme' : tx.type === 'bonus' ? 'Prim' : 'Kesinti'}</div>
                                <div className="text-[10px] text-gray-400 font-medium">{new Date(tx.date).toLocaleDateString('tr-TR')}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`font-black text-lg ${['earning', 'bonus', 'payment'].includes(tx.type) ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {['earning', 'bonus', 'payment'].includes(tx.type) ? '+' : '-'}{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tx.amount)}
                            </div>
                            <div className="text-[9px] text-gray-300 font-bold uppercase truncate max-w-[100px]">{tx.description || '-'}</div>
                        </div>
                    </div>
                ))}

                {(!ledger || ledger.length === 0) && (
                    <div className="py-20 text-center space-y-4">
                        <div className="text-4xl">📭</div>
                        <div className="text-gray-400 font-medium italic">Henüz bir işlem kaydı bulunmuyor.</div>
                    </div>
                )}
            </div>
        </div>
    );
}
