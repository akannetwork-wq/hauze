import { getAuthenticatedClient } from '@/app/actions/auth-helper';
import { redirect } from 'next/navigation';
import {
    CreditCardIcon,
    CalendarDaysIcon,
    BriefcaseIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';
import { logout } from '@/app/actions/auth';
import Link from 'next/link';

export default async function PersonnelPortalPage() {
    const { supabase, employee, user, tenant } = await getAuthenticatedClient();

    if (!employee) {
        redirect('/admin');
    }

    // Fetch real balance
    const { data: balanceData } = await supabase
        .from('personnel_balances')
        .select('balance')
        .eq('id', employee.id)
        .single();

    const balance = Number(balanceData?.balance || 0);

    // Fetch transaction counts / recent
    const { count: txCount } = await supabase
        .from('personnel_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employee.id);

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tightest leading-none capitalize">
                        Merhaba, <br />
                        {employee.first_name}
                    </h1>
                    <p className="text-gray-400 font-bold text-sm flex items-center gap-1.5 uppercase tracking-widest">
                        <BriefcaseIcon className="w-4 h-4" /> {employee.position || 'Personel'}
                    </p>
                </div>
                <div className="w-16 h-16 bg-white border border-gray-100 rounded-[2rem] shadow-sm flex items-center justify-center text-gray-400 font-black text-xl">
                    {employee.first_name.charAt(0)}
                </div>
            </div>

            {/* Quick Stats Card */}
            <div className={`rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group transition-all duration-500 ${balance >= 0 ? 'bg-indigo-600 shadow-indigo-100' : 'bg-rose-600 shadow-rose-100'}`}>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10 flex flex-col gap-10">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Güncel Bakiyem</span>
                        <CreditCardIcon className="w-6 h-6 opacity-40" />
                    </div>
                    <div className="text-6xl font-black tracking-tighter leading-none">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(balance)}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {balance >= 0 ? 'ALACAKLI DURUMDASINIZ' : 'TOPLAM BORÇ / AVANS'}
                    </div>
                </div>
            </div>

            {/* Menu Sections */}
            <div className="grid grid-cols-1 gap-4">
                <Link href="/me/attendance" className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between hover:scale-[1.02] transition-all cursor-pointer">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
                            <CalendarDaysIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="font-black text-gray-900">Puantaj Bilgilerim</div>
                            <div className="text-xs text-gray-400 font-medium italic">Giriş/Çıkış kayıtlarını gör</div>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="9 5l7 7-7 7" /></svg>
                    </div>
                </Link>

                <Link href="/me/transactions" className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between hover:scale-[1.02] transition-all cursor-pointer">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center">
                            <CreditCardIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="font-black text-gray-900">Ödemeler & Avanslar</div>
                            <div className="text-xs text-gray-400 font-medium italic">Toplam {txCount || 0} işlem kaydı</div>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="9 5l7 7-7 7" /></svg>
                    </div>
                </Link>
            </div>

            {/* Footer / Account */}
            <div className="pt-10 space-y-4">
                <div className="text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{user.email}</p>
                </div>
                <form action={logout}>
                    <button className="w-full bg-red-50 text-red-600 py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                        <ArrowRightOnRectangleIcon className="w-6 h-6" /> Güvenli Çıkış
                    </button>
                </form>
            </div>

            <p className="text-center text-[10px] text-gray-300 font-black uppercase tracking-widest pt-4">
                NetSpace Employee Portal v1.0
            </p>
        </div>
    );
}
