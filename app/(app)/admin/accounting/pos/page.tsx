import { getFinanceAccounts } from '@/app/actions/finance';
import AccountManager from '../definitions/components/account-manager';

export default async function PosPage() {
    const accounts = await getFinanceAccounts('pos');

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">POS Hesapları</h1>
                <p className="text-gray-500 mt-2">POS hesaplarınızı buradan yönetin.</p>
            </div>

            <AccountManager initialAccounts={accounts} mode="pos" />
        </div>
    );
}
