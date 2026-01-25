'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveAttendance, addPersonnelTransaction, deleteAttendance } from '@/app/actions/personnel';

interface Props {
    employees: any[];
    initialAttendance: any[];
    month: string;
}

export default function AttendanceGridClient({ employees, initialAttendance, month }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    // Optimistic state for instant feedback
    const [optimisticAttendance, setOptimisticAttendance] = useState<any[]>(initialAttendance);
    const [workerTypeFilter, setWorkerTypeFilter] = useState<'all' | 'monthly' | 'daily'>('all');

    // Synchronize optimistic state when props change
    const [prevInitial, setPrevInitial] = useState(initialAttendance);
    if (initialAttendance !== prevInitial) {
        setOptimisticAttendance(initialAttendance);
        setPrevInitial(initialAttendance);
    }

    // Generate days with names
    const year = parseInt(month.split('-')[0]);
    const monthIdx = parseInt(month.split('-')[1]) - 1;
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

    // Turkish day names
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, monthIdx, i + 1);
        return {
            day: i + 1,
            name: dayNames[date.getDay()],
            isWeekend: date.getDay() === 0 || date.getDay() === 6
        };
    });

    const getEntry = (employeeId: string, day: number) => {
        const dateStr = `${month}-${String(day).padStart(2, '0')}`;
        return optimisticAttendance.find(a => a.employee_id === employeeId && a.date === dateStr);
    };

    async function handleQuickUpdate(employeeId: string, day: number, currentStatus: string | null) {
        // Cycle: Empty -> Present -> Absent -> Leave -> Half-Day -> Double -> Empty...
        const nextStatusMap: Record<string, string | null> = {
            'present': 'double',
            'double': 'absent',
            'absent': 'leave',
            'leave': 'half-day',
            'half-day': null
        };
        const nextStatus = currentStatus ? nextStatusMap[currentStatus] : 'present';
        const dateStr = `${month}-${String(day).padStart(2, '0')}`;

        // Optimistic Update
        setOptimisticAttendance(prev => {
            const filtered = prev.filter(a => !(a.employee_id === employeeId && a.date === dateStr));
            if (nextStatus) {
                return [...filtered, { employee_id: employeeId, date: dateStr, status: nextStatus }];
            }
            return filtered;
        });

        if (nextStatus) {
            const rateMultiplier = nextStatus === 'double' ? 2.0 : 1.0;
            const hours = nextStatus === 'half-day' ? 4 : (nextStatus === 'present' || nextStatus === 'double' ? 8 : 0);

            const result = await saveAttendance({
                employee_id: employeeId,
                date: dateStr,
                status: nextStatus,
                hours: hours,
                rate_multiplier: rateMultiplier,
                // Pass previous status to handle earning updates properly
                previous_status: currentStatus
            });

            // Only process daily worker earnings if saving was successful
            if (result.success && employees.find(e => e.id === employeeId)?.worker_type === 'daily') {
                // Earning is now handled inside saveAttendance action to avoid duplicates
                // No need to call addPersonnelTransaction here
            } else if (!result.success) {
                alert('Puantaj kaydedilemedi: ' + result.error);
            }
        } else {
            // Delete record
            const result = await deleteAttendance(employeeId, dateStr);
            if (!result.success) {
                alert('Puantaj silinemedi: ' + result.error);
            }
        }

        router.refresh();
    }

    const filteredEmployees = employees.filter(emp => {
        if (workerTypeFilter === 'all') return true;
        return emp.worker_type === workerTypeFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 bg-white p-2 rounded-full border border-gray-100 shadow-sm w-fit">
                <button
                    onClick={() => setWorkerTypeFilter('daily')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${workerTypeFilter === 'daily' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                    GÜNLÜK
                </button>
                <button
                    onClick={() => setWorkerTypeFilter('monthly')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${workerTypeFilter === 'monthly' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                    MAAŞLI
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[1200px] border-collapse">
                    <thead className="bg-gray-50/50 border-b border-gray-100 h-20">
                        <tr className=''>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 pl-8 sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Personel</th>
                            {days.map(d => (
                                <th key={d.day} className={`px-1 py-2 text-[10px] font-bold text-gray-400 text-center w-10 border-l border-gray-100/50 ${d.isWeekend ? 'bg-indigo-50/30 text-indigo-400' : ''}`}>
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <span className="opacity-50 text-[9px] uppercase tracking-tighter mb-1">{d.name}</span>
                                        <span className="text-sm text-gray-600">{d.day}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredEmployees.map(emp => (
                            <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-3 sticky left-0 bg-white group-hover:bg-gray-50 z-20 border-r border-gray-100 pl-8 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                    <div className="font-bold text-gray-900 text-sm truncate w-40">{emp.first_name} {emp.last_name}</div>
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                                        {emp.worker_type === 'daily' ? 'GÜNLÜK' : 'AYLIK'}
                                    </div>
                                </td>
                                {days.map(d => {
                                    const entry = getEntry(emp.id, d.day);
                                    const status = entry?.status;

                                    return (
                                        <td
                                            key={d.day}
                                            className={`p-0 border-l border-gray-100 h-14 min-w-[40px] relative ${d.isWeekend ? 'bg-gray-50/30' : ''}`}
                                        >
                                            <button
                                                onClick={() => handleQuickUpdate(emp.id, d.day, status)}
                                                className={`absolute inset-0 w-full h-full text-[10px] font-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-10 ${status === 'present' ? 'bg-emerald-500 text-white shadow-inner' :
                                                    status === 'absent' ? 'bg-rose-500 text-white shadow-inner' :
                                                        status === 'leave' ? 'bg-indigo-500 text-white shadow-inner' :
                                                            status === 'half-day' ? 'bg-amber-500 text-white shadow-inner' :
                                                                status === 'double' ? 'bg-violet-600 text-white shadow-inner' :
                                                                    'hover:bg-black/5 hover:text-gray-400 text-transparent'
                                                    }`}
                                            >
                                                {status === 'present' ? 'P' :
                                                    status === 'absent' ? 'X' :
                                                        status === 'leave' ? 'İ' :
                                                            status === 'half-day' ? '½' :
                                                                status === 'double' ? '2X' : ''}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600"><div className="w-5 h-5 bg-emerald-500 rounded-lg shadow-sm"></div> GELDI (P)</div>
                <div className="flex items-center gap-2 text-violet-600"><div className="w-5 h-5 bg-violet-600 rounded-lg shadow-sm"></div> FAZLA MESAİ (2X)</div>
                <div className="flex items-center gap-2 text-rose-600"><div className="w-5 h-5 bg-rose-500 rounded-lg shadow-sm"></div> GELMEDI (X)</div>
                <div className="flex items-center gap-2 text-indigo-600"><div className="w-5 h-5 bg-indigo-500 rounded-lg shadow-sm"></div> İZİNLİ (İ)</div>
                <div className="flex items-center gap-2 text-amber-600"><div className="w-5 h-5 bg-amber-500 rounded-lg shadow-sm"></div> YARIM GÜN (½)</div>
                <div className="ml-auto text-gray-400 normal-case font-medium italic">Tıklayarak durumu değiştirebilir veya silebilirsiniz.</div>
            </div>
        </div>
    );
}
