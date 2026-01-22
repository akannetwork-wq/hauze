'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Drawer from './ui/drawer';

// Dynamic imports for drawer contents to break circular/complex module graphs
const PersonnelDrawer = dynamic(() => import('@/app/(app)/admin/personnel/employees/components/personnel-drawer'), {
    loading: () => <PlaceholderContent text="Personel Bilgileri" />
});

const ContactDrawer = dynamic(() => import('@/app/(app)/admin/accounting/components/contact-drawer'), {
    loading: () => <PlaceholderContent text="Cari Bilgileri" />
});

// Lazy load drawer contents to keep initial bundle small
const PlaceholderContent = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest text-[10px]">{text} Yükleniyor...</p>
    </div>
);

export default function DrawerManager() {
    return (
        <Suspense fallback={null}>
            <DrawerContent />
        </Suspense>
    );
}

function DrawerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const drawerType = searchParams.get('drawer');
    const id = searchParams.get('id');

    const isOpen = !!drawerType;

    const closeDrawer = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('drawer');
        params.delete('id');
        params.delete('type');
        router.push(pathname + '?' + params.toString(), { scroll: false });
    };

    // Configuration for different drawer types
    const drawerConfig: Record<string, { title: string; subtitle?: string; size?: 'md' | 'lg' | 'xl' | '2xl' }> = {
        'add-employee': { title: 'Yeni Personel Kaydı', subtitle: 'Sisteme yeni bir çalışan ekleyin.', size: 'xl' },
        'edit-employee': { title: 'Personel Düzenle', subtitle: 'Çalışan bilgilerini ve yetkilerini güncelleyin.', size: 'xl' },
        'add-customer': { title: 'Yeni Müşteri Kaydı', subtitle: 'Sisteme yeni bir müşteri ekleyin.', size: 'xl' },
        'add-supplier': { title: 'Yeni Tedarikçi Kaydı', subtitle: 'Sisteme yeni bir tedarikçi ekleyin.', size: 'xl' },
        'edit-contact': { title: 'Cari Bilgilerini Düzenle', subtitle: 'İletişim ve finansal tanımlamaları güncelleyin.', size: 'xl' },
        'contact-detail': { title: 'Cari Kartı', subtitle: 'Cari hesap bilgileri ve işlem geçmişi.', size: '2xl' },
        'contact-statement': { title: 'Cari Ekstre', subtitle: 'Tüm borç/alacak ve işlem geçmişi.', size: '2xl' },
        'commerce-form': { title: 'İşlem Formu', subtitle: 'Satış, Alım veya İade kaydı oluşturun.', size: '2xl' },
    };

    const config = drawerType ? drawerConfig[drawerType] : null;

    if (!isOpen || !config) return null;

    return (
        <Drawer
            isOpen={isOpen}
            onClose={closeDrawer}
            title={config.title}
            subtitle={config.subtitle}
            size={config.size}
        >
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {(drawerType === 'add-employee' || drawerType === 'edit-employee') && (
                    <PersonnelDrawer id={id} />
                )}
                {drawerType === 'add-customer' && (
                    <ContactDrawer mode="add" type="customer" />
                )}
                {drawerType === 'add-supplier' && (
                    <ContactDrawer mode="add" type="supplier" />
                )}
                {drawerType === 'edit-contact' && (
                    <ContactDrawer id={id} mode="edit" />
                )}
                {drawerType === 'contact-detail' && (
                    <ContactDrawer id={id} mode="detail" />
                )}
                {drawerType === 'contact-statement' && <PlaceholderContent text={`Cari (${id}) Ekstre`} />}
                {drawerType === 'commerce-form' && <PlaceholderContent text="Ticari İşlem Formu" />}
            </div>
        </Drawer>
    );
}
