import { getEmployees } from '@/app/actions/personnel';
import PersonnelFinanceClient from './client';

export default async function PersonnelFinanceFetcher() {
    const employees = await getEmployees();

    return (
        <div className="animate-in fade-in duration-700">
            <PersonnelFinanceClient employees={employees} />
        </div>
    );
}
