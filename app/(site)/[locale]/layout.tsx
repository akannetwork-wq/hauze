import { getPublicPages } from '@/app/actions/cms-public';
import { headers } from 'next/headers';

export default async function SiteLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Check Hostname
    const headersList = await headers();
    const hostname = headersList.get('host')!.split(':')[0]; // Fix port removal

    const menuItems = await getPublicPages(hostname, 'main');

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b py-4 px-6 flex justify-between items-center">
                <div className="font-bold text-xl">Tenant Site ({locale})</div>
                <nav className="flex gap-4">
                    <a href={`/${locale}/home`} className="hover:underline text-sm font-medium">Home</a>
                    {menuItems.map((page: any) => {
                        // Resolve localized title
                        const title = (locale !== 'tr' && page.locales?.[locale]?.title)
                            ? page.locales[locale].title
                            : page.title;

                        // Resolve localized path
                        const pathString = (locale !== 'tr' && page.locales?.[locale]?.path)
                            ? page.locales[locale].path
                            : page.path;

                        // Ensure path starts with slash but doesn't double slash
                        const cleanPath = pathString.startsWith('/') ? pathString : `/${pathString}`;

                        return (
                            <a
                                key={page.path}
                                href={`/${locale}${cleanPath}`}
                                className="hover:underline text-sm font-medium"
                            >
                                {title}
                            </a>
                        );
                    })}
                </nav>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="py-6 bg-gray-100 text-center text-sm text-gray-500">
                Powered by Netspace
            </footer>
        </div>
    );
}
