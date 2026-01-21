import { getEmployees } from '@/app/actions/personnel';
import PersonnelFinanceClient from './client';
import Link from 'next/link';

export default async function PersonnelFinancePage() {
    const employees = await getEmployees();

    return (
        <div className="p-8 font-sans max-w-[1200px] mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/personnel" className="hover:text-indigo-600 transition-colors">Personel</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Finans & Bordro</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Finansal Durum & Bordro Yönetimi</h1>
                </div>
            </div>

            <PersonnelFinanceClient employees={employees} />
        </div>
    );
}
