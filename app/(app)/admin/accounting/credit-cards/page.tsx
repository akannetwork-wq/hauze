import CreditCardListClient from './credit-card-list-client';

export default async function CreditCardsPage() {
    return (
        <div className="max-w-6xl mx-auto p-8 animate-in fade-in duration-700">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight text-indigo-600">Kredi Kartları</h1>
                    <p className="text-gray-500 mt-2 font-medium">İşletme kredi kartı limitleri ve borç takibi.</p>
                </div>
            </div>

            <CreditCardListClient />
        </div>
    );
}
