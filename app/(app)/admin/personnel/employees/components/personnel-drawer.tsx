'use client';

import { useState, useEffect } from 'react';
import { getEmployee, getPersonnelLedger } from '@/app/actions/personnel';
import EmployeeEditorClient from '../[id]/editor-client';

interface Props {
    id?: string | null;
}

export default function PersonnelDrawer({ id }: Props) {
    const [initialData, setInitialData] = useState<any>(null);
    const [ledger, setLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(!!id);

    useEffect(() => {
        if (id) {
            async function load() {
                setLoading(true);
                try {
                    const [employee, employeeLedger] = await Promise.all([
                        getEmployee(id!),
                        getPersonnelLedger(id!)
                    ]);
                    setInitialData(employee);
                    setLedger(employeeLedger || []);
                } catch (error) {
                    console.error('Error loading personnel drawer data:', error);
                } finally {
                    setLoading(false);
                }
            }
            load();
        } else {
            setInitialData(null);
            setLedger([]);
            setLoading(false);
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <div className="w-12 h-12 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="font-black uppercase tracking-widest text-[10px] text-gray-400">Veriler Yükleniyor...</p>
            </div>
        );
    }

    return (
        <EmployeeEditorClient
            initialData={initialData}
            ledger={ledger}
            isDrawer={true}
        />
    );
}
