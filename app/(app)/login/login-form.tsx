'use client';

import { login } from '@/app/actions/auth';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all hover:-translate-y-0.5"
        >
            {pending ? 'Oturum Açılıyor...' : 'Oturum Aç'}
        </button>
    );
}

export default function LoginForm() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(formData: FormData) {
        setError(null);
        const res = await login(formData);
        if (res?.error) {
            setError(res.error);
            setSuccess(false);
        } else if (res?.success) {
            setSuccess(true);
            setError(null);
            // Hard refresh to clear all client state and trigger layout auth check
            setTimeout(() => {
                window.location.href = '/admin';
            }, 500);
        }
    }

    return (
        <form className="mt-8 space-y-6" action={handleSubmit}>
            <div className="space-y-4">
                <div className="group">
                    <label htmlFor="email-address" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block group-focus-within:text-indigo-600 transition-colors">E-posta Adresi</label>
                    <input
                        id="email-address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="appearance-none relative block w-full px-5 py-4 border-none bg-gray-50 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10 sm:text-sm shadow-inner placeholder:text-gray-300"
                        placeholder="admin@netspace.com"
                    />
                </div>
                <div className="group">
                    <label htmlFor="password" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block group-focus-within:text-indigo-600 transition-colors">Şifre</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="appearance-none relative block w-full px-5 py-4 border-none bg-gray-50 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10 sm:text-sm shadow-inner placeholder:text-gray-300"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            {error && (
                <div className="text-red-600 text-[11px] font-bold text-center bg-red-50 p-4 rounded-2xl border border-red-100 animate-in shake duration-300">
                    ⚠️ {error}
                </div>
            )}

            {success && (
                <div className="text-emerald-600 text-[11px] font-black text-center bg-emerald-50 p-4 rounded-2xl border border-emerald-100 animate-in fade-in zoom-in duration-300">
                    ✅ Giriş başarılı! Yönlendiriliyorsunuz...
                </div>
            )}

            <div>
                <SubmitButton />
            </div>

            <div className="text-center">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Netspace Bulut Altyapısı ile Güçlendirilmiştir</p>
            </div>
        </form>
    );
}
