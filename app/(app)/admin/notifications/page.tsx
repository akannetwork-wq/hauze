'use server';

import React from 'react';
import { getNotifications } from '@/app/actions/notifications';
import NotificationItem from './components/notification-item';

export default async function NotificationsPage() {
    const notifications = await getNotifications();

    const stats = {
        high: notifications.filter(n => n.severity === 'high').length,
        medium: notifications.filter(n => n.severity === 'medium').length,
        low: notifications.filter(n => n.severity === 'low').length,
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                        Bildirimler <span className="bg-indigo-600 text-white text-base px-3 py-1 rounded-full">{notifications.length}</span>
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">İşletmenizin sağlığını korumak için kritik uyarıları takip edin.</p>
                </div>
            </div>

            {/* Severity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-red-50 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-2xl">🚨</div>
                    <div>
                        <div className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Kritik</div>
                        <div className="text-3xl font-black text-red-600 leading-none">{stats.high}</div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-amber-50 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl">⚠️</div>
                    <div>
                        <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1">Uyarı</div>
                        <div className="text-3xl font-black text-amber-600 leading-none">{stats.medium}</div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-50 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">ℹ️</div>
                    <div>
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Bilgi</div>
                        <div className="text-3xl font-black text-indigo-600 leading-none">{stats.low}</div>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Aktif Uyarılar</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {notifications.sort((a, b) => {
                        const score = { high: 3, medium: 2, low: 1 };
                        return (score[b.severity] || 0) - (score[a.severity] || 0);
                    }).map((n) => (
                        <NotificationItem
                            key={n.id}
                            id={n.id}
                            type={n.type}
                            title={n.title}
                            description={n.description}
                            link={n.link}
                            severity={n.severity}
                        />
                    ))}

                    {notifications.length === 0 && (
                        <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center">
                            <div className="text-6xl mb-6">🎉</div>
                            <h4 className="text-2xl font-black text-gray-900 mb-2">Her Şey Yolunda!</h4>
                            <p className="text-gray-400 font-medium">Şu an müdahale gerektiren bir bildirim bulunmuyor.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
