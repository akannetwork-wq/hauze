'use client';

import { useRouter } from 'next/navigation';

export default function MonthSelector({ defaultValue }: { defaultValue: string }) {
    const router = useRouter();

    return (
        <div className="flex gap-4 items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <input
                type="month"
                defaultValue={defaultValue}
                onChange={(e) => {
                    router.push(`/admin/personnel/attendance?month=${e.target.value}`);
                }}
                className="bg-transparent border-none outline-none font-bold text-sm text-indigo-600 px-3 cursor-pointer"
            />
        </div>
    );
}
