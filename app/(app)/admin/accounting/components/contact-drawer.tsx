'use client';

import { Suspense, useEffect, useState } from 'react';
import { getContactDetail, getContactOrders, getContactTransactions } from '@/app/actions/accounting';
import ContactEditor from './contact-editor';
import ContactDetailClient from './contact-detail-client';

interface Props {
    id?: string | null;
    type?: 'customer' | 'supplier';
    mode: 'add' | 'edit' | 'detail';
}

export default function ContactDrawer({ id, type = 'customer', mode }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(mode !== 'add');

    useEffect(() => {
        if (mode !== 'add' && id) {
            async function load() {
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
            load();
        }
    }, [id, mode]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <div className="w-12 h-12 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Veriler Yükleniyor...</p>
            </div>
        );
    }

    if (mode === 'add' || mode === 'edit') {
        return (
            <ContactEditor
                initialData={data?.contact}
                type={type}
                onSuccess={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('drawer');
                    url.searchParams.delete('id');
                    window.history.pushState({}, '', url.toString());
                    // Force a re-render or notification if needed, but for now URL change handles it in Manager
                }}
            />
        );
    }

    if (mode === 'detail' && data) {
        return (
            <ContactDetailClient
                contact={data.contact}
                account={data.account}
                totals={data.totals}
                orders={data.orders}
                transactions={data.transactions}
                type={data.contact?.type || type}
                isDrawer={true}
            />
        );
    }

    return <div className="text-center p-12 text-gray-400 font-medium">Veri bulunamadı.</div>;
}
