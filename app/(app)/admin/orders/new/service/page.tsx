import { getProducts } from '@/app/actions/inventory';
import ServiceOrderForm from './service-order-form';

export default async function NewServiceOrderPage() {
    // We preload services for the form
    const services = await getProducts({ type: 'service' });

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Hizmet Siparişi Oluştur</h1>
                <p className="text-gray-400 text-sm font-medium mt-1">Akıllı fiyatlandırma motoru ile hızlı ve hatasız hizmet satışı gerçekleştirin.</p>
            </div>

            <ServiceOrderForm services={services} />
        </div>
    );
}
