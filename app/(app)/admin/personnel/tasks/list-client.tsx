'use client';

import { useState } from 'react';
import { savePersonnelTask } from '@/app/actions/personnel';
import { useRouter } from 'next/navigation';

interface Props {
    tasks: any[];
    employees: any[];
}

export default function TaskListClient({ tasks, employees }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignee_id: '',
        priority: 'medium',
        status: 'pending',
        due_date: ''
    });

    async function handleSave() {
        if (!newTask.title) return alert('Başlık zorunludur.');
        setLoading(true);
        const result = await savePersonnelTask(newTask);
        setLoading(false);
        if (result.success) {
            setShowModal(false);
            setNewTask({ title: '', description: '', assignee_id: '', priority: 'medium', status: 'pending', due_date: '' });
            router.refresh();
        }
    }

    async function handleStatusUpdate(task: any, nextStatus: string) {
        setLoading(true);
        await savePersonnelTask({ ...task, status: nextStatus });
        setLoading(false);
        router.refresh();
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex gap-4">
                    <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Bekleyen Görev</div>
                        <div className="text-xl font-black text-indigo-700">{tasks.filter(t => t.status === 'pending').length}</div>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                >
                    + Görev Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col group">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${task.priority === 'urgent' ? 'bg-rose-50 text-rose-600' :
                                    task.priority === 'high' ? 'bg-amber-50 text-amber-600' :
                                        'bg-blue-50 text-blue-600'
                                }`}>
                                {task.priority}
                            </span>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">{task.due_date?.substring(0, 10) || 'Belirsiz'}</div>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-6 h-8 leading-relaxed">{task.description || 'Açıklama yok.'}</p>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">👤</div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                {task.employees?.first_name ? `${task.employees.first_name} ${task.employees.last_name}` : 'Atanmamış'}
                            </span>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                            {task.status !== 'completed' ? (
                                <button
                                    onClick={() => handleStatusUpdate(task, 'completed')}
                                    className="flex-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                                >
                                    TAMAMLA
                                </button>
                            ) : (
                                <div className="flex-1 text-center text-emerald-600 text-[10px] font-black uppercase py-2 bg-emerald-50 rounded-xl">✓ TAMAMLANDI</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Modal for New Task */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
                        <h3 className="text-xl font-black text-gray-900">Yeni Görev Atama</h3>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Başlık</label>
                            <input
                                type="text"
                                value={newTask.title}
                                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Sorumlu Personel</label>
                            <select
                                value={newTask.assignee_id}
                                onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Seçiniz...</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700">Kaydet</button>
                            <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-50 text-gray-400 font-bold py-3 rounded-2xl">Vazgeç</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
