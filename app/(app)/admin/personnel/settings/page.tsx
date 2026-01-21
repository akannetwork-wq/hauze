import { getCurrentContext } from '@/app/actions/tenant-context';
import PersonnelSettingsClient from './settings-client';
import Link from 'next/link';

export default async function PersonnelSettingsPage() {
    const context = await getCurrentContext();
    const settings = context?.tenant?.config?.personnel || { salary_payment_day: 5, weekly_payment_day: 5 };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8 flex items-center gap-2 text-sm text-gray-400">
                <Link href="/admin/personnel" className="hover:text-indigo-600 transition-colors">Personel</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">Ayarlar</span>
            </div>
            <PersonnelSettingsClient settings={settings} />
        </div>
    );
}
