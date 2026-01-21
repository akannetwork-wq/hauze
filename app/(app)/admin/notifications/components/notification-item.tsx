import React from 'react';

interface Props {
    id: string;
    type: string;
    title: string;
    description: string;
    link: string;
    severity: 'low' | 'medium' | 'high';
}

const severityConfig = {
    high: 'bg-red-50 text-red-700 border-red-100 ring-red-500/10',
    medium: 'bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/10',
    low: 'bg-indigo-50 text-indigo-700 border-indigo-100 ring-indigo-500/10',
};

const iconConfig: Record<string, string> = {
    missing_price: '🏷️',
    unprofitable_price: '📉',
    low_stock: '📦',
    delayed_order: '⏳',
};

export default function NotificationItem({ type, title, description, link, severity }: Props) {
    const severityStyles = severityConfig[severity] || severityConfig.low;
    const icon = iconConfig[type] || '🔔';

    return (
        <a
            href={link}
            className={`group block p-6 rounded-[2rem] border transition-all hover:scale-[1.01] hover:shadow-xl active:scale-100 ${severityStyles}`}
        >
            <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-white/80 backdrop-blur rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:rotate-6 transition-transform">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="font-black text-lg tracking-tight">{title}</h4>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] uppercase font-black tracking-widest">İncele</span>
                            <span className="text-sm">→</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium leading-relaxed opacity-80 line-clamp-2">
                        {description}
                    </p>
                </div>
            </div>
        </a>
    );
}
