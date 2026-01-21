'use server';

import React from 'react';
import { getOrder } from '@/app/actions/orders';
import OrderDetailClient from './order-detail-client';
import { notFound } from 'next/navigation';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const order = await getOrder(id);

    if (!order) {
        notFound();
    }

    return <OrderDetailClient order={order} />;
}
