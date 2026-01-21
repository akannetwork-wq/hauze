import { getEmployees } from '@/app/actions/personnel';
import EmployeeListClient from './list-client';
import Link from 'next/link';

export default async function EmployeeListPage() {
    const employees = await getEmployees();

    return (
        <div className="p-8 font-sans max-w-[1200px] mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/personnel" className="hover:text-indigo-600 transition-colors">Personel</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Rehber</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Personel Rehberi</h1>
                </div>
                <Link
                    href="/admin/personnel/employees/new"
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                >
                    + Yeni Kayıt
                </Link>
            </div>

            <EmployeeListClient employees={employees} />
        </div>
    );
}
