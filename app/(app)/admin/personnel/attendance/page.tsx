import { getEmployees, getAttendance } from '@/app/actions/personnel';
import AttendanceGridClient from './grid-client';
import MonthSelector from './month-selector';
import Link from 'next/link';

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
    const sParams = await searchParams;
    const currentMonth = sParams.month || new Date().toISOString().substring(0, 7);

    const [employees, attendance] = await Promise.all([
        getEmployees(),
        getAttendance({ month: currentMonth })
    ]);

    return (
        <div className="p-8 font-sans max-w-[1400px] mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/personnel" className="hover:text-indigo-600 transition-colors">Personel</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Puantaj</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Aylık Puantaj Cetveli</h1>
                </div>

                <MonthSelector defaultValue={currentMonth} />
            </div>

            <AttendanceGridClient
                employees={employees}
                initialAttendance={attendance}
                month={currentMonth}
            />
        </div>
    );
}
