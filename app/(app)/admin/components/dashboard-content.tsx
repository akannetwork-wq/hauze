import { Suspense } from 'react';
import Link from 'next/link';
import { getAccountingSummary } from '@/app/actions/accounting';
import { getOrders } from '@/app/actions/orders';
import { getSalaryStats } from '@/app/actions/personnel';
import { formatCurrency } from '@/lib/utils';
import {
    UsersIcon,
    ShoppingBagIcon,
    BanknotesIcon,
    WalletIcon,
    PlusIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline'; // Changed from lucide-react
import { headers } from 'next/headers';

export default async function DashboardContent() {
    await headers(); // Force dynamic

    const [accounting, recentOrders, salaryStats] = await Promise.all([
        getAccountingSummary(),
        getOrders({ limit: 5 }),
        getSalaryStats()
    ]);

    // Helper Card Component since we don't have separate Shadcn ones
    const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
        <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className || ''}`}>
            {children}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">Toplam Alacak</h3>
                        <BanknotesIcon className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(accounting.totalReceivables)}</div>
                        <p className="text-xs text-gray-500 mt-1">Müşterilerden beklenen</p>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">Toplam Borç (Tüm)</h3>
                        <BanknotesIcon className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(accounting.totalPayables)}</div>
                        <p className="text-xs text-gray-500 mt-1">Cari, Personel ve KK Borçları</p>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">Net Finansal Değer</h3>
                        <WalletIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                        <div className={`text-2xl font-bold ${accounting.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(accounting.netBalance)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Varlık + Alacak - Tüm Borçlar</p>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">Personel Ödemeleri</h3>
                        <UsersIcon className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(accounting.totalPersonnelPayable)}</div>
                        <p className="text-xs text-gray-500 mt-1">Tahakkuk etmiş net personel borçları</p>
                    </div>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Orders - Takes 4 columns */}
                <Card className="col-span-4 flex flex-col">
                    <div className="p-6 pb-4 border-b border-gray-100 flex flex-row items-center justify-between">
                        <div>
                            <h3 className="font-semibold leading-none tracking-tight">Son Siparişler</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Sistemdeki son 5 satış siparişi.
                            </p>
                        </div>
                        <Link href="/admin/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
                            Tümünü Gör <ArrowRightIcon className="w-3 h-3 ml-1" />
                        </Link>
                    </div>
                    <div className="p-6 pt-2">
                        <div className="space-y-4">
                            {recentOrders.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">Henüz sipariş bulunmuyor.</p>
                            ) : (
                                recentOrders.map((order: any) => (
                                    <div key={order.id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0 pt-2">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none text-gray-900">
                                                {order.employees
                                                    ? `${order.employees.first_name} ${order.employees.last_name}`
                                                    : (order.contacts?.company_name || `${order.contacts?.first_name} ${order.contacts?.last_name || ''}`)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('tr-TR')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</p>
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${order.payment_status === 'paid' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                    order.payment_status === 'partial' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                                                        'bg-red-50 text-red-700 ring-red-600/20'
                                                    }`}>
                                                    {order.payment_status === 'paid' ? 'Ödendi' :
                                                        order.payment_status === 'partial' ? 'Kısmi' : 'Bekliyor'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-b-xl border-t border-gray-100 flex justify-end mt-auto">
                        <Link href="/admin?drawer=global-order" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-9 px-4 py-2">
                            <PlusIcon className="mr-2 h-4 w-4" /> Yeni Sipariş
                        </Link>
                    </div>
                </Card>

                {/* Quick Actions & Secondary Stats - Takes 3 columns */}
                <div className="col-span-3 space-y-4">
                    <Card className="p-6">
                        <h3 className="font-semibold leading-none tracking-tight mb-1">Hızlı İşlemler</h3>
                        <p className="text-sm text-gray-500 mb-4">Sık kullanılan işlemler.</p>

                        <div className="grid gap-2">
                            <Link href="/admin/accounting/customers?drawer=add-customer" className="inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-10 px-4 py-2 text-gray-700">
                                <UsersIcon className="mr-2 h-4 w-4" /> Yeni Müşteri
                            </Link>
                            <Link href="/admin/accounting/suppliers?drawer=add-supplier" className="inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-10 px-4 py-2 text-gray-700">
                                <UsersIcon className="mr-2 h-4 w-4" /> Yeni Tedarikçi
                            </Link>
                            <Link href="/admin?drawer=global-order" className="inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-10 px-4 py-2 text-gray-700">
                                <ShoppingBagIcon className="mr-2 h-4 w-4" /> Yeni Satış Siparişi
                            </Link>
                            <Link href="/admin/personnel/employees?drawer=add-employee" className="inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-10 px-4 py-2 text-gray-700">
                                <UsersIcon className="mr-2 h-4 w-4" /> Yeni Personel Ekle
                            </Link>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold leading-none tracking-tight mb-4">Finans Durumu</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                                <span className="text-sm text-gray-500">Kasa Mevcudu</span>
                                <span className="font-bold text-lg text-gray-900">{formatCurrency(accounting.totalCash)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Aktif Personel</span>
                                <span className="font-bold text-lg text-gray-900">{salaryStats.activeEmployeeCount || '-'}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
