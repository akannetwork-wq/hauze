import { getAuthenticatedClient } from '@/app/actions/auth-helper';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronLeftIcon,
    ClockIcon,
    MapPinIcon
} from '@heroicons/react/24/solid';

export default async function PersonnelAttendancePage() {
    const { supabase, employee } = await getAuthenticatedClient();

    if (!employee) {
        redirect('/admin');
    }

    // Fetch detailed attendance
    const { data: attendance } = await supabase
        .from('personnel_attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .order('date', { ascending: false })
        .limit(50);

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/me" className="w-12 h-12 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                    <ChevronLeftIcon className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Puantaj Kayıtlarım</h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Çalışma Geçmişi</p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {attendance?.map((log: any) => (
                    <div key={log.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm font-black text-gray-900">
                                {new Date(log.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                            <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${log.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    log.status === 'double' ? 'bg-violet-50 text-violet-600 border border-violet-100' :
                                        log.status === 'half-day' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            log.status === 'absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                log.status === 'leave' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                                    'bg-gray-50 text-gray-400 border border-gray-100'
                                }`}>
                                {log.status === 'present' ? 'TAM GÜN' :
                                    log.status === 'double' ? 'FAZLA MESAİ (2X)' :
                                        log.status === 'half-day' ? 'YARIM GÜN (½)' :
                                            log.status === 'absent' ? 'GELMEDİ (X)' :
                                                log.status === 'leave' ? 'İZİNLİ' : 'BİLİNMİYOR'}
                            </div>
                        </div>

                        {(log.check_in || log.check_out) && (
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">GİRİŞ</div>
                                    <div className="flex items-center gap-1.5 text-gray-700 font-bold text-sm">
                                        <ClockIcon className="w-4 h-4 text-gray-300" />
                                        {log.check_in || '--:--'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ÇIKIŞ</div>
                                    <div className="flex items-center gap-1.5 text-gray-700 font-bold text-sm">
                                        <ClockIcon className="w-4 h-4 text-gray-300" />
                                        {log.check_out || '--:--'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {log.notes && (
                            <div className="text-[11px] text-gray-400 italic bg-gray-50/50 p-3 rounded-xl border border-dotted border-gray-100">
                                "{log.notes}"
                            </div>
                        )}
                    </div>
                ))}

                {(!attendance || attendance.length === 0) && (
                    <div className="py-20 text-center space-y-4">
                        <div className="text-4xl">🗓️</div>
                        <div className="text-gray-400 font-medium italic">Henüz bir puantaj kaydı bulunmuyor.</div>
                    </div>
                )}
            </div>
        </div>
    );
}
