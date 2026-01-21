import { getPersonnelTasks, getEmployees } from '@/app/actions/personnel';
import TaskListClient from './list-client';
import Link from 'next/link';

export default async function PersonnelTasksPage() {
    const [tasks, employees] = await Promise.all([
        getPersonnelTasks(),
        getEmployees()
    ]);

    return (
        <div className="p-8 font-sans max-w-[1200px] mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Link href="/admin/personnel" className="hover:text-indigo-600 transition-colors">Personel</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">Görevler</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Görev Takip Paneli</h1>
            </div>

            <TaskListClient tasks={tasks} employees={employees} />
        </div>
    );
}
