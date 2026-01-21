
import { getModules } from '@/app/actions/terminal-queries';

export default async function ModulesPage() {
    const modules = await getModules();

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">System Modules</h1>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-700 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Key</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {modules.map((m: any) => (
                            <tr key={m.key}>
                                <td className="px-6 py-4 font-mono text-blue-300">{m.key}</td>
                                <td className="px-6 py-4 font-bold text-white">{m.name}</td>
                                <td className="px-6 py-4 text-gray-400">{m.description}</td>
                            </tr>
                        ))}
                        {modules.length === 0 && (
                            <tr>
                                <td className="px-6 py-4" colSpan={3}>
                                    No modules found. Please run seed data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-4 bg-gray-900 border border-gray-700 rounded text-sm text-gray-500">
                To add modules, update the <code>modules</code> table in the database.
            </div>
        </div>
    );
}
