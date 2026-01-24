import { getFinanceAccounts } from '@/app/actions/finance';
import AccountManager from './components/account-manager';

export default async function FinanceDefinitionsPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
    const { mode } = await searchParams;
    const accounts = await getFinanceAccounts();

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Finans Tanımları</h1>
                <p className="text-gray-500 mt-2">Banka hesapları, nakit kasalar ve POS cihazlarınızı buradan yönetebilirsiniz.</p>
            </div>

            <AccountManager initialAccounts={accounts} mode={mode as any} />
        </div>
    );
}
