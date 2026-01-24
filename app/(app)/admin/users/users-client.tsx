'use client';

import { useState } from 'react';
import { createUser, removeUserFromTenant, updateUserPermissions, updateUserRole } from '@/app/actions/users';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
    UserIcon,
    ShieldCheckIcon,
    KeyIcon,
    TrashIcon,
    PlusIcon,
    XMarkIcon,
    CheckCircleIcon
} from '@heroicons/react/24/solid';

interface Props {
    initialUsers: any[];
    availableModules: any[];
}

export default function UsersClient({ initialUsers, availableModules }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');

    const [editingPermissions, setEditingPermissions] = useState<any | null>(null);

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        setLoading('invite');
        const res = await createUser(email, password, role);
        setLoading(null);

        if (res.success) {
            toast.success('Kullanıcı başarıyla oluşturuldu ve eklendi.');
            setInviteModalOpen(false);
            setEmail('');
            setPassword('');
            router.refresh();
        } else {
            toast.error('Hata: ' + res.error);
        }
    }

    async function handleRoleChange(userId: string, newRole: string) {
        if (!confirm(`Kullanıcı rolünü "${newRole}" olarak değiştirmek istediğinize emin misiniz?`)) return;

        setLoading(userId);
        const res = await updateUserRole(userId, newRole);
        setLoading(null);

        if (res.success) {
            toast.success('Rol güncellendi.');
            router.refresh();
        } else {
            toast.error('Hata: ' + res.error);
        }
    }

    async function handlePermissionToggle(moduleKey: string) {
        if (!editingPermissions) return;

        const newPermissions = {
            ...editingPermissions.permissions,
            [moduleKey]: !editingPermissions.permissions[moduleKey]
        };

        setEditingPermissions({ ...editingPermissions, permissions: newPermissions });

        // Auto-save on toggle? Yes, smoother experience.
        const res = await updateUserPermissions(editingPermissions.user_id, newPermissions);
        if (!res.success) {
            toast.error('Giriş yetkisi güncellenemedi: ' + res.error);
        }
    }

    async function handleDelete(userId: string, name: string) {
        if (!confirm(`${name} isimli kullanıcıyı bu işletmeden çıkarmak istediğinize emin misiniz?`)) return;

        setLoading(userId);
        const res = await removeUserFromTenant(userId);
        setLoading(null);

        if (res.success) {
            toast.success('Kullanıcı işletmeden çıkarıldı.');
            router.refresh();
        } else {
            toast.error('Hata: ' + res.error);
        }
    }

    return (
        <div className="space-y-6">
            {/* Quick Actions */}
            <div className="flex justify-end">
                <button
                    onClick={() => setInviteModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
                >
                    <PlusIcon className="w-5 h-5" /> Yeni Kullanıcı Ekle
                </button>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5">Kullanıcı</th>
                            <th className="px-8 py-5">Rol</th>
                            <th className="px-8 py-5">Yetkiler</th>
                            <th className="px-8 py-5 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {initialUsers.map(u => (
                            <tr key={u.id} className="text-sm hover:bg-gray-50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-black">
                                            {u.profiles?.avatar_url ? (
                                                <img src={u.profiles.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                                            ) : (
                                                (u.profiles?.full_name || u.profiles?.email || '?').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900">{u.profiles?.full_name || 'İsimsiz Kullanıcı'}</div>
                                            <div className="text-xs text-gray-400 font-medium font-mono">{u.profiles?.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <select
                                        value={u.role}
                                        onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                                        className={`bg-white border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-tighter outline-none focus:border-indigo-500 transition-all ${u.role === 'super_admin' ? 'text-indigo-600 border-indigo-50' : 'text-gray-500'
                                            }`}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </td>
                                <td className="px-8 py-5">
                                    {u.role === 'super_admin' ? (
                                        <span className="flex items-center gap-1.5 text-indigo-600 font-black text-[10px] uppercase bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                                            <ShieldCheckIcon className="w-4 h-4" /> Tam Yetkili
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => setEditingPermissions(u)}
                                            className="text-xs font-black text-gray-500 hover:text-indigo-600 flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-all"
                                        >
                                            <KeyIcon className="w-4 h-4" />
                                            {Object.values(u.permissions || {}).filter(v => v === true).length} Modül Aktif
                                        </button>
                                    )}
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleDelete(u.user_id, u.profiles?.full_name || u.profiles?.email)}
                                            disabled={loading === u.user_id}
                                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            {inviteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)} />
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setInviteModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Kullanıcı Ekle</h2>
                        <p className="text-gray-400 text-sm mb-8 font-medium">E-posta adresi ile işletmeye yeni üye dâhil edin.</p>

                        <form onSubmit={handleInvite} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">E-posta Adresi</label>
                                <input
                                    type="email" required
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="ornek@sirket.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Şifre (Opsiyonel)</label>
                                <input
                                    type="password"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <p className="text-[9px] text-gray-400 pl-1 italic">Boş bırakırsanız e-posta daveti gönderilir.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Başlangıç Rolü</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-indigo-500 transition-all"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="user">User (Standart)</option>
                                    <option value="admin">Admin (Yönetici)</option>
                                    <option value="super_admin">Süper Admin (Tam Yetki)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading === 'invite'}
                                className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-xl shadow-gray-200"
                            >
                                {loading === 'invite' ? 'İşlem Yapılıyor...' : password ? '🚀 Kullanıcıyı Direkt Oluştur' : '📩 Davet Gönder'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Permissions Drawer / Modal */}
            {editingPermissions && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingPermissions(null)} />
                    <div className="bg-white w-full max-w-md h-full shadow-2xl relative p-10 flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Yetki Ayarları</h2>
                                <p className="text-gray-400 font-medium text-sm mt-1">{editingPermissions.profiles?.full_name} için erişim kısıtlamaları.</p>
                            </div>
                            <button onClick={() => setEditingPermissions(null)} className="p-2 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                                <XMarkIcon className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-4">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 block">Modül Erişimi</div>

                            {/* Standard Core Modules */}
                            {[
                                { key: 'dashboard', name: 'Dashboard (Özet)', icon: '📊' },
                                { key: 'accounting', name: 'Muhasebe', icon: '💰' },
                                { key: 'orders', name: 'Siparişler', icon: '📦' },
                                { key: 'personnel', name: 'Personel', icon: '👥' },
                                { key: 'inventory', name: 'Envanter', icon: '🏗️' },
                                { key: 'wms', name: 'WMS (Depo Operasyon)', icon: '🚛' },
                                { key: 'pages', name: 'Site Sayfaları', icon: '🌐' },
                            ].map(m => (
                                <button
                                    key={m.key}
                                    onClick={() => handlePermissionToggle(m.key)}
                                    className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${editingPermissions.permissions[m.key]
                                        ? 'border-emerald-100 bg-emerald-50/30'
                                        : 'border-gray-50 bg-gray-50/50 grayscale opacity-60'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{m.icon}</span>
                                        <span className="font-bold text-gray-900 text-sm">{m.name}</span>
                                    </div>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${editingPermissions.permissions[m.key] ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white text-gray-200'
                                        }`}>
                                        <CheckCircleIcon className="w-6 h-6" />
                                    </div>
                                </button>
                            ))}

                            {/* Dynamic Tenant Modules */}
                            {availableModules.length > 0 && (
                                <div className="pt-8 space-y-4">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 block">Ek Modüller</div>
                                    {availableModules.map((m: any) => (
                                        <button
                                            key={m.key}
                                            onClick={() => handlePermissionToggle(m.key)}
                                            className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${editingPermissions.permissions[m.key]
                                                ? 'border-emerald-100 bg-emerald-50/30'
                                                : 'border-gray-50 bg-gray-50/50 grayscale opacity-60'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">🧩</span>
                                                <span className="font-bold text-gray-900 text-sm">{m.name}</span>
                                            </div>
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${editingPermissions.permissions[m.key] ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white text-gray-200'
                                                }`}>
                                                <CheckCircleIcon className="w-6 h-6" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-8">
                            <button
                                onClick={() => setEditingPermissions(null)}
                                className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black hover:scale-105 transition-all shadow-xl shadow-gray-200"
                            >
                                Değişiklikleri Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
