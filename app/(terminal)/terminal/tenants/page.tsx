
import { getTenants } from '@/app/actions/terminal-queries';
import CreateTenantForm from './create-form';
import ResetTenantButton from './reset-button';

// Next.js 16 handles dynamic rendering automatically with cacheComponents

export default async function TenantsPage() {
    const tenants = await getTenants();

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Tenant Registry</h1>

            <CreateTenantForm />

            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-700 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Hostname</th>
                            <th className="px-6 py-3">Active</th>
                            <th className="px-6 py-3">Created</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {tenants.map((t: any) => (
                            <tr key={t.id} className="hover:bg-gray-750 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">{t.name}</td>
                                <td className="px-6 py-4">{t.hostname}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs ${t.is_active ? 'bg-green-900/50 text-green-300 border border-green-800' : 'bg-red-900/50 text-red-300 border border-red-800'}`}>
                                        {t.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(t.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <ResetTenantButton tenantId={t.id} tenantName={t.name} />
                                </td>
                            </tr>
                        ))}
                        {tenants.length === 0 && (
                            <tr>
                                <td className="px-6 py-4" colSpan={5}>No tenants found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

