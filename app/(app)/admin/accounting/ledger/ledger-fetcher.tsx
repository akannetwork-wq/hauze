import { getAccounts } from '@/app/actions/accounting';
import LedgerClient from './ledger-client';

export default async function LedgerFetcher() {
    const accounts = await getAccounts();

    return <LedgerClient initialAccounts={accounts} />;
}
