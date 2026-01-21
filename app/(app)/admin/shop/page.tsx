
import { getPrices, createPrice, getInventory, updateStock } from '@/app/actions/commerce';

export default async function ShopPage() {
    const prices = await getPrices();
    const inventory = await getInventory(); // array of items

    // Helper to find stock for a sku
    const getStock = (sku: string) => {
        const item = inventory.find((i: any) => i.sku === sku);
        return item?.state?.on_hand || 0;
    }

    async function handleCreate(formData: FormData) {
        'use server';
        await createPrice(formData);
    }

    async function handleStockUpdate(formData: FormData) {
        'use server';
        const sku = formData.get('sku') as string;
        const qty = parseInt(formData.get('qty') as string);
        await updateStock(sku, qty);
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Shop Management</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Create Product Form */}
                <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                    <h2 className="text-lg font-semibold mb-4">Add Product (Price)</h2>
                    <form action={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">SKU</label>
                            <input name="sku" className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2" placeholder="e.g. T-SHIRT-BLK-M" required />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Price</label>
                                <input name="amount" type="number" step="0.01" className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2" placeholder="0.00" required />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Currency</label>
                                <select name="currency" className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2">
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                        </div>
                        <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Add Product</button>
                    </form>
                </div>

                {/* Products List */}
                <div className="md:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
                            <tr>
                                <th className="px-6 py-3">SKU</th>
                                <th className="px-6 py-3">Price</th>
                                <th className="px-6 py-3">Stock (Main)</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {prices.map((p: any) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-sm text-indigo-600 font-bold">{p.sku}</td>
                                    <td className="px-6 py-4 font-medium">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency }).format(p.amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <form action={handleStockUpdate} className="flex items-center gap-2">
                                            <input type="hidden" name="sku" value={p.sku} />
                                            <input
                                                name="qty"
                                                type="number"
                                                defaultValue={getStock(p.sku)}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                            />
                                            <button className="text-xs text-blue-600 hover:text-blue-800">Update</button>
                                        </form>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {prices.length === 0 && (
                                <tr>
                                    <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>No products found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
