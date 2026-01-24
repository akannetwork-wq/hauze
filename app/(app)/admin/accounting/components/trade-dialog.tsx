'use client';

import TradeForm from './trade-form';
import Drawer from '@/components/admin/ui/drawer';

interface Props {
    contact: any;
    type: 'sale' | 'purchase';
    onClose: () => void;
    onSuccess: () => void;
}

export default function TradeDialog({ contact, type, onClose, onSuccess }: Props) {
    return (
        <Drawer
            isOpen={true}
            onClose={onClose}
            title={type === 'sale' ? '🎯 Yeni Satış' : '📦 Yeni Satın Alma'}
            subtitle={contact.company_name || `${contact.first_name} ${contact.last_name}`}
        >
            <TradeForm
                contact={contact}
                type={type}
                onClose={onClose}
                onSuccess={onSuccess}
            />
        </Drawer>
    );
}
