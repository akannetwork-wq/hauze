'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTenant } from '@/app/actions/terminal';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
            {pending ? 'Provisioning...' : 'Create Tenant'}
        </button>
    );
}

export default function CreateTenantForm() {
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    async function handleSubmit(formData: FormData) {
        setMsg('');
        const res = await createTenant(formData);
        if (res?.error) {
            setMsg(res.error);
            setIsError(true);
        } else {
            setMsg('Tenant created successfully.');
            setIsError(false);
            // Optional: reset form or reload page? 
            // The server action calls revalidatePath, so the list below should update.
        }
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg mb-12">
            <h2 className="text-xl font-bold mb-4 text-white">Provision New Tenant</h2>
            <form action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Tenant Name</label>
                        <input name="name" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="Acme Corp" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Hostname</label>
                        <input name="hostname" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="acme.netspace.com" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Admin Email</label>
                        <input name="adminEmail" type="email" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="admin@acme.com" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Initial Password</label>
                        <input name="password" type="password" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="*******" required />
                    </div>
                </div>
                {msg && (
                    <div className={`p-2 rounded text-sm ${isError ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
                        {msg}
                    </div>
                )}
                <div className="flex justify-end">
                    <SubmitButton />
                </div>
            </form>
        </div>
    )
}
