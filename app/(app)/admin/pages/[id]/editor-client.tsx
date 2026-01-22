'use client';

import { useState, useEffect, useCallback } from 'react';
import { updatePage, deletePage, checkPathAvailability, getUniquePath } from '@/app/actions/cms';
import { uploadCoverImage, deletePageStorage } from '@/app/actions/storage';
import { useRouter } from 'next/navigation';
import { generateSlug } from '@/lib/slug';
import type { Page, Section, SectionType, MenuLocation, Product, ProductCategory } from '@/types';
import PageBuilder from '@/components/admin/cms/builder/page-builder';

// --- Sections defined locally for now, but migrating to PageBuilder ---
const SECTION_TYPES: { type: SectionType; label: string; icon: string }[] = [
    { type: 'hero', label: 'Hero Banner', icon: '🎯' },
    { type: 'text', label: 'Text Block', icon: '📝' },
    { type: 'cta', label: 'Call to Action', icon: '📢' },
    { type: 'gallery', label: 'Image Gallery', icon: '🖼️' },
    { type: 'faq', label: 'FAQ', icon: '❓' },
    { type: 'video', label: 'Video', icon: '🎬' },
    { type: 'product-grid', label: 'Product Grid', icon: '🛍️' },
    { type: 'html', label: 'Custom HTML', icon: '💻' },
];

export default function PageEditorClient({
    initialPage,
    allPages = [],
}: {
    initialPage: Page,
    allPages?: Page[],
    products?: Product[],
    categories?: ProductCategory[]
}) {
    const router = useRouter();
    const [page, setPage] = useState<Page>(initialPage);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [sections, setSections] = useState<Section[]>(page.sections || []);
    const [activeTab, setActiveTab] = useState<'details' | 'builder'>('builder');

    // Slug lock
    const [slugLocked, setSlugLocked] = useState(!!initialPage.path);

    // Multi-language State
    const [locale, setLocale] = useState('tr');
    const [translations, setTranslations] = useState(page.locales || {});

    // --- Localization Helpers ---
    const getLocalized = useCallback((key: keyof Page, fallback: string = ''): string => {
        if (locale === 'tr') return fallback;
        const localeData = translations[locale];
        return localeData?.[key as string] || '';
    }, [locale, translations]);

    const setLocalized = useCallback((key: string, value: string) => {
        if (locale === 'tr') {
            setPage(prev => ({ ...prev, [key]: value }));
        } else {
            setTranslations(prev => ({
                ...prev,
                [locale]: {
                    ...prev[locale],
                    [key]: value
                }
            }));
        }
    }, [locale]);

    // Slug validation state
    const [slugError, setSlugError] = useState('');
    const [isCheckingSlug, setIsCheckingSlug] = useState(false);

    // Debounced slug and auto-generation check
    useEffect(() => {
        const syncSlug = async () => {
            if (locale !== 'tr') return;
            if (!slugLocked && page.title) {
                setIsCheckingSlug(true);
                const baseSlug = generateSlug(page.title);
                if (baseSlug) {
                    const uniquePath = await getUniquePath(baseSlug, page.id);
                    if (uniquePath !== page.path) {
                        setPage(prev => ({ ...prev, path: uniquePath }));
                    }
                }
                setIsCheckingSlug(false);
                setSlugError('');
                return;
            }
            if (slugLocked && page.path) {
                setIsCheckingSlug(true);
                const { available } = await checkPathAvailability(page.path, page.id);
                setIsCheckingSlug(false);
                if (!available) {
                    setSlugError('This slug is already in use.');
                } else {
                    setSlugError('');
                }
            }
        };
        const timer = setTimeout(syncSlug, 500);
        return () => clearTimeout(timer);
    }, [page.title, page.path, page.id, locale, slugLocked]);

    const handleSave = async () => {
        if (slugError) return;
        setSaving(true);
        try {
            await updatePage(page.id, { ...page, sections, locales: translations });
        } catch (e) {
            console.error('Save Error:', e);
            alert('Error saving page.');
        }
        setSaving(false);
    };

    return (
        <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col gap-6 min-h-0">

                {/* Editor Tabs */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 shrink-0">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'details'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <span>📄</span> Page Details
                    </button>
                    <button
                        onClick={() => setActiveTab('builder')}
                        className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'builder'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <span>🏗️</span> Visual Builder
                    </button>
                </div>

                {activeTab === 'builder' ? (
                    <div className="flex-1 min-h-0 w-full">
                        <PageBuilder
                            initialSections={sections}
                            onSave={async (newSections) => {
                                setSections(newSections);
                                setSaving(true);
                                try {
                                    await updatePage(page.id, { ...page, sections: newSections, locales: translations });
                                } finally {
                                    setSaving(false);
                                }
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Language Tabs */}
                        <div className="flex gap-2 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                            <span className="text-xs text-gray-400 uppercase font-bold mr-2 self-center">Language:</span>
                            {['tr', 'en'].map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setLocale(lang)}
                                    className={`px-4 py-1.5 text-sm font-bold uppercase rounded transition-colors ${locale === lang
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>

                        {/* Cover Image */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-2">Cover Image</label>
                            <div className="relative">
                                {page.cover_image ? (
                                    <div className="relative group">
                                        <img src={page.cover_image} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                            <button onClick={() => (document.getElementById('cover-upload') as HTMLInputElement)?.click()} className="bg-white text-gray-800 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-100">Change</button>
                                            <button onClick={async () => { if (confirm('Remove?')) { await deletePageStorage(page.id); setPage({ ...page, cover_image: null, cover_thumb: null }); } }} className="bg-red-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-600">Remove</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div onClick={() => (document.getElementById('cover-upload') as HTMLInputElement)?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group">
                                        <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto group-hover:bg-indigo-100"><span className="text-2xl">📷</span></div>
                                        <p className="text-sm font-medium text-gray-600 mt-3">Upload cover image</p>
                                    </div>
                                )}
                                <input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    setIsCheckingSlug(true);
                                    const result = await uploadCoverImage(page.id, formData);
                                    if (result.success && result.url) setPage({ ...page, cover_image: result.url, cover_thumb: result.thumbUrl || null });
                                    setIsCheckingSlug(false);
                                }} />
                            </div>
                        </div>

                        {/* SEO & Path */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Page Title</label>
                                <input value={locale === 'tr' ? page.title : getLocalized('title', page.title)} onChange={e => setLocalized('title', e.target.value)} className="text-3xl font-bold w-full outline-none border-b border-transparent hover:border-gray-100 focus:border-indigo-500 pb-1" placeholder="Untitled Page" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Path / Slug</label>
                                <div className="relative">
                                    <input value={locale === 'tr' ? page.path : getLocalized('path', page.path)} onChange={e => { setLocalized('path', e.target.value); if (!slugLocked) setSlugLocked(true); }} className={`text-sm text-gray-600 w-full outline-none font-mono bg-gray-50 rounded px-3 py-2 ${slugError && locale === 'tr' ? 'border-red-300 bg-red-50' : ''}`} placeholder="/example-page" />
                                    {isCheckingSlug && locale === 'tr' && <div className="absolute right-3 top-2.5 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />}
                                </div>
                                {slugError && locale === 'tr' && <p className="text-xs text-red-500 mt-1 font-bold">⚠️ {slugError}</p>}
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Meta Description</label>
                                <textarea value={locale === 'tr' ? (page.description || '') : getLocalized('description', page.description || '')} onChange={e => setLocalized('description', e.target.value)} className="w-full outline-none resize-none bg-gray-50 rounded px-3 py-2 text-sm" placeholder="Brief description..." rows={2} />
                            </div>
                        </div>

                        {/* Rich Content Editor */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-3">Legacy Content (HTML)</label>
                            <div contentEditable suppressContentEditableWarning className="min-h-[200px] outline-none prose max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200 focus:bg-white" dangerouslySetInnerHTML={{ __html: locale === 'tr' ? (page.content || '') : (getLocalized('content', page.content) || '') }} onBlur={e => setLocalized('content', e.currentTarget.innerHTML)} />
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar (Only visible in Details mode) */}
            <div className={`w-80 flex flex-col gap-4 sticky top-0 h-fit transition-all duration-300 ${activeTab === 'builder' ? 'opacity-0 pointer-events-none w-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                {/* Actions */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4 text-sm font-bold">
                        <span>Status</span>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${page.is_published ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className={page.is_published ? 'text-green-600' : 'text-yellow-600'}>{page.is_published ? 'Published' : 'Draft'}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <button onClick={handleSave} disabled={saving || !!slugError} className={`w-full py-2.5 rounded-lg font-bold text-white shadow-lg ${saving || !!slugError ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}>
                            {saving ? 'SAVING...' : 'SAVE ALL CHANGES'}
                        </button>
                        <button onClick={() => setPage({ ...page, is_published: !page.is_published })} className="w-full py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 uppercase">
                            {page.is_published ? 'Set to Draft' : 'Publish Page'}
                        </button>
                        <button onClick={async () => { if (confirm('Delete?')) { setDeleting(true); const r = await deletePage(page.id); if (r?.error) { alert(r.error); setDeleting(false); } else { router.push('/admin/pages'); } } }} disabled={deleting} className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg uppercase transition-colors">
                            {deleting ? 'DELETING...' : 'DELETE PAGE'}
                        </button>
                    </div>
                </div>

                {/* Settings */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    <h3 className="text-xs uppercase font-bold text-gray-400">Navigation</h3>
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Parent</label>
                        <select value={page.parent_id || ''} onChange={e => setPage({ ...page, parent_id: e.target.value || null })} className="w-full rounded-lg border-gray-200 text-xs p-2 border">
                            <option value="">None</option>
                            {allPages.filter(p => p.id !== page.id).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Menu Location</label>
                        <select value={page.menu_location || 'main'} onChange={e => setPage({ ...page, menu_location: e.target.value as MenuLocation })} className="w-full rounded-lg border-gray-200 text-xs p-2 border capitalize">
                            {['main', 'footer', 'deep', 'hidden'].map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
