import { getAccounts, getTransactions } from '@/app/actions/accounting';
import TransactionClient from '@/app/(app)/admin/accounting/ledger/[id]/transaction-client';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const accounts = await getAccounts();
    const account = accounts.find(a => a.id === id);

    if (!account) return notFound();

    const transactions = await getTransactions(id);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/accounting" className="hover:text-indigo-600 transition-colors">Muhasebe</Link>
                        <span>/</span>
                        <Link href="/admin/accounting/ledger" className="hover:text-indigo-600 transition-colors">Mizan</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Hesap Detayı</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{account.name}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="font-mono text-indigo-600 font-bold">{account.code}</span>
                        <span className="text-gray-300">|</span>
                        <span className={`font-black text-lg ${(account.balance || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            Güncel Bakiye: {(account.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {account.currency}
                        </span>
                    </div>
                </div>
            </div>

            <TransactionClient account={account} initialTransactions={transactions} />
        </div>
    );
}
