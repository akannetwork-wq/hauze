import { getEmployee, getPersonnelLedger } from '@/app/actions/personnel';
import EmployeeEditorClient from './editor-client';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EmployeeEditorPage({ params }: Props) {
    const { id } = await params;
    const isNew = id === 'new';

    let employee = null;
    let ledger: any[] = [];

    if (!isNew) {
        employee = await getEmployee(id);
        if (!employee) notFound();
        ledger = await getPersonnelLedger(id);
    }

    return (
        <div className="p-8 font-sans max-w-[1200px] mx-auto transition-all">
            <EmployeeEditorClient initialData={employee} ledger={ledger} />
        </div>
    );
}
