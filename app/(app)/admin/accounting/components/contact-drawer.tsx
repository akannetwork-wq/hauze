'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getContactDetail, getContactOrders, getContactTransactions } from '@/app/actions/accounting';
import ContactEditor from './contact-editor';
import ContactDetailClient from './contact-detail-client';

interface Props {
    id?: string | null;
    type?: 'customer' | 'supplier' | 'subcontractor';
    mode: 'add' | 'edit' | 'detail';
}

export default function ContactDrawer({ id, type = 'customer', mode }: Props) {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(mode !== 'add');

    const refreshData = async () => {
        if (mode !== 'add' && id) {
            setLoading(true);
            try {
                const [detail, orders, transactions] = await Promise.all([
                    getContactDetail(id!),
                    getContactOrders(id!),
                    getContactTransactions(id!)
                ]);

                if (detail) {
                    setData({
                        contact: detail.contact,
                        account: detail.account,
                        totals: detail.totals,
                        orders,
                        transactions
                    });
                }
            } catch (error) {
                console.error('Error loading contact drawer data:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        refreshData();
    }, [id, mode]);

    if (loading && !data) { // Only show full spinner if no data yet
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <div className="w-12 h-12 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Veriler Yükleniyor...</p>
            </div>
        );
    }

    if (mode === 'add') {
        return (
            <ContactEditor
                type={type}
                onSuccess={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('drawer');
                    url.searchParams.delete('id');

                    router.push(url.pathname + '?' + url.searchParams.toString(), { scroll: false });
                    router.refresh();
                }}
            />
        );
    }

    if ((mode === 'detail' || mode === 'edit') && data) {
        return (
            <ContactDetailClient
                contact={data.contact}
                account={data.account}
                totals={data.totals}
                orders={data.orders}
                transactions={data.transactions}
                type={data.contact?.type || type}
                isDrawer={true}
                initialTab={mode === 'edit' ? 'edit' : 'orders'}
                onRefresh={refreshData}
            />
        );
    }

    return <div className="text-center p-12 text-gray-400 font-medium">Veri bulunamadı.</div>;
}
