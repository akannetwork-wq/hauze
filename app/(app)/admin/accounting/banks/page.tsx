import { getFinanceAccounts } from '@/app/actions/finance';
import AccountManager from '../definitions/components/account-manager';

export default async function BanksPage() {
    const accounts = await getFinanceAccounts('bank');

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight text-blue-600">Banka Hesapları</h1>
                    <p className="text-gray-500 mt-2 font-medium">Banka bakiyeleri ve KMH (Kredili Mevduat Hesabı) takibi.</p>
                </div>
            </div>

            <AccountManager initialAccounts={accounts} mode="bank" />
        </div>
    );
}
