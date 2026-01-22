import LoginForm from './login-form';
import { getCurrentContext } from '@/app/actions/tenant-context';

export default async function LoginPage() {
    const context = await getCurrentContext();
    const tenantName = context?.tenant?.name || 'Netspace';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2.5rem] text-white text-3xl font-black shadow-2xl shadow-indigo-200 mb-8 border-4 border-white">
                        {tenantName.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                        Panele Giriş Yap
                    </h2>
                    <p className="text-gray-400 text-sm font-medium tracking-wide">
                        {tenantName} yönetim alanına hoş geldiniz.
                    </p>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-100 border border-gray-50">
                    <LoginForm />
                </div>

                <div className="flex justify-center gap-8 mt-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Güvenli Altyapı</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Otomatik Yedekleme</div>
                </div>
            </div>
        </div>
    );
}
