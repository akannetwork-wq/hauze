import { getTenantUsers } from '@/app/actions/users';
import { getAuthenticatedClient } from '@/app/actions/auth-helper';
import UsersClient from '@/app/(app)/admin/users/users-client';

export default async function UsersPage() {
    const users = await getTenantUsers();
    const { modules } = await getAuthenticatedClient();

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Kullanıcı Yönetimi</h1>
                    <p className="text-gray-500 font-medium mt-1">Ekibinizi yönetin ve modül bazlı yetkilendirme yapın.</p>
                </div>
            </div>

            <UsersClient initialUsers={users} availableModules={modules} />
        </div>
    );
}
