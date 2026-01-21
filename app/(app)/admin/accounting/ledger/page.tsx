import { getAccounts } from '@/app/actions/accounting';
import LedgerClient from '@/app/(app)/admin/accounting/ledger/ledger-client';
import Link from 'next/link';

export default async function LedgerPage() {
    const accounts = await getAccounts();

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/accounting" className="hover:text-amber-600 transition-colors">Muhasebe</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Mizan / Hesap Planı</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Hesap Planı ve Mizan</h1>
                </div>
            </div>

            <LedgerClient initialAccounts={accounts} />
        </div>
    );
}
