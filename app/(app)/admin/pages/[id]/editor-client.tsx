'use client';

import { useState, useEffect, useCallback } from 'react';
import { updatePage, deletePage, checkPathAvailability, getUniquePath } from '@/app/actions/cms';
import { uploadCoverImage, deleteStorageObject, deletePageStorage } from '@/app/actions/storage';
import { useRouter } from 'next/navigation';
import { generateSlug } from '@/lib/slug';
import type { Page, Section, SectionType, MenuLocation, Product, ProductCategory } from '@/types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Section Type Definitions ---
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

// --- Sortable Section Component ---
function SortableSection({
    section,
    onUpdate,
    onDelete,
    products,
    categories
}: {
    section: Section;
    onUpdate: (id: string, content: Record<string, any>) => void;
    onDelete: (id: string) => void;
    products: Product[];
    categories: ProductCategory[];
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const sectionInfo = SECTION_TYPES.find(s => s.type === section.type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group relative bg-white border border-gray-200 hover:border-indigo-300 rounded-lg p-4 transition-all shadow-sm"
        >
            {/* Drag Handle & Actions */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
                        title="Drag to reorder"
                    >
                        ⋮⋮
                    </button>
                    <span className="text-xs font-bold uppercase text-indigo-500 flex items-center gap-1">
                        {sectionInfo?.icon} {sectionInfo?.label || section.type}
                    </span>
                </div>
                <button
                    onClick={() => onDelete(section.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-lg transition-opacity"
                    title="Delete section"
                >
                    ×
                </button>
            </div>

            {/* Section Content Editor */}
            {section.type === 'hero' && (
                <div className="space-y-2">
                    <input
                        value={section.content.headline || ''}
                        onChange={e => onUpdate(section.id, { headline: e.target.value })}
                        className="text-2xl font-bold w-full outline-none bg-gray-50 rounded p-2"
                        placeholder="Headline"
                    />
                    <textarea
                        value={section.content.subheadline || ''}
                        onChange={e => onUpdate(section.id, { subheadline: e.target.value })}
                        className="w-full outline-none resize-none text-gray-600 bg-gray-50 rounded p-2"
                        placeholder="Subheadline..."
                        rows={2}
                    />
                </div>
            )}

            {section.type === 'text' && (
                <textarea
                    value={section.content.text || ''}
                    onChange={e => onUpdate(section.id, { text: e.target.value })}
                    className="w-full outline-none resize-none min-h-[80px] bg-gray-50 rounded p-2"
                    placeholder="Enter text content..."
                />
            )}

            {section.type === 'cta' && (
                <div className="space-y-2">
                    <input
                        value={section.content.title || ''}
                        onChange={e => onUpdate(section.id, { title: e.target.value })}
                        className="font-bold w-full outline-none bg-gray-50 rounded p-2"
                        placeholder="CTA Title"
                    />
                    <input
                        value={section.content.buttonText || ''}
                        onChange={e => onUpdate(section.id, { buttonText: e.target.value })}
                        className="w-full outline-none bg-gray-50 rounded p-2"
                        placeholder="Button Text"
                    />
                    <input
                        value={section.content.buttonLink || ''}
                        onChange={e => onUpdate(section.id, { buttonLink: e.target.value })}
                        className="w-full outline-none bg-gray-50 rounded p-2 text-sm font-mono"
                        placeholder="Button Link (e.g. /contact)"
                    />
                </div>
            )}

            {section.type === 'gallery' && (
                <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-300">
                    <span className="text-2xl">🖼️</span>
                    <p className="text-sm text-gray-500 mt-2">Image Gallery</p>
                    <p className="text-xs text-gray-400">Upload images to gallery (coming soon)</p>
                </div>
            )}

            {section.type === 'faq' && (
                <div className="space-y-2">
                    <input
                        value={section.content.title || ''}
                        onChange={e => onUpdate(section.id, { title: e.target.value })}
                        className="font-bold w-full outline-none bg-gray-50 rounded p-2"
                        placeholder="FAQ Section Title"
                    />
                    <p className="text-xs text-gray-400 p-2">FAQ items editor (coming soon)</p>
                </div>
            )}

            {section.type === 'video' && (
                <div className="space-y-2">
                    <input
                        value={section.content.url || ''}
                        onChange={e => onUpdate(section.id, { url: e.target.value })}
                        className="w-full outline-none bg-gray-50 rounded p-2 text-sm font-mono"
                        placeholder="Video URL (YouTube, Vimeo)"
                    />
                </div>
            )}

            {section.type === 'product-grid' && (
                <div className="space-y-3 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                    <div>
                        <label className="block text-[10px] uppercase text-indigo-400 font-bold mb-1">Grid Headline</label>
                        <input
                            value={section.content.headline || ''}
                            onChange={e => onUpdate(section.id, { headline: e.target.value })}
                            className="w-full outline-none bg-white p-2 rounded border border-indigo-100 font-bold text-indigo-900"
                            placeholder="Section Title (e.g. New Arrivals)"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] uppercase text-indigo-400 font-bold mb-1">Source Type</label>
                            <select
                                value={section.content.sourceType || 'all'}
                                onChange={e => onUpdate(section.id, { sourceType: e.target.value })}
                                className="w-full p-2 rounded border border-indigo-100 text-sm outline-none"
                            >
                                <option value="all">All Products</option>
                                <option value="category">Category</option>
                                <option value="manual">Manual Selection</option>
                            </select>
                        </div>

                        {section.content.sourceType === 'category' && (
                            <div>
                                <label className="block text-[10px] uppercase text-indigo-400 font-bold mb-1">Select Category</label>
                                <select
                                    value={section.content.categoryId || ''}
                                    onChange={e => onUpdate(section.id, { categoryId: e.target.value })}
                                    className="w-full p-2 rounded border border-indigo-100 text-sm outline-none"
                                >
                                    <option value="">(Pick Category)</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-medium italic">
                        <span>🛍️</span>
                        <span>
                            {section.content.sourceType === 'all' && `Showing all ${products.length} products`}
                            {section.content.sourceType === 'category' && section.content.categoryId &&
                                `Showing products from ${categories.find(c => c.id === section.content.categoryId)?.name}`}
                            {section.content.sourceType === 'manual' && 'Manual selection coming soon'}
                        </span>
                    </div>
                </div>
            )}

            {section.type === 'html' && (
                <textarea
                    value={section.content.html || ''}
                    onChange={e => onUpdate(section.id, { html: e.target.value })}
                    className="w-full outline-none resize-none min-h-[100px] bg-gray-900 text-green-400 rounded p-2 font-mono text-sm"
                    placeholder="<div>Custom HTML...</div>"
                />
            )}
        </div>
    );
}

// --- Main Editor Component ---
export default function PageEditorClient({
    initialPage,
    allPages = [],
    products = [],
    categories = []
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

    // Slug lock - if true, title changes won't auto-update slug
    // Start as locked if page already has a path
    const [slugLocked, setSlugLocked] = useState(!!initialPage.path);

    // Multi-language State
    const [locale, setLocale] = useState('tr');
    const [translations, setTranslations] = useState(page.locales || {});

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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

            // CASE 1: Auto-generation from Title
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

            // CASE 2: Manual Path Validation
            if (slugLocked && page.path) {
                setIsCheckingSlug(true);
                const { available, error } = await checkPathAvailability(page.path, page.id);
                setIsCheckingSlug(false);

                if (error) {
                    console.error(error);
                    return;
                }

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

    // --- Save Handler ---
    async function handleSave() {
        if (slugError) return;

        setSaving(true);
        try {
            const result = await updatePage(page.id, {
                ...page,
                sections,
                locales: translations
            });
            if (result?.error) {
                alert('Error saving: ' + result.error);
            }
        } catch (e) {
            console.error('Client Error:', e);
            alert('Error: ' + e);
        }
        setSaving(false);
    }

    // --- Section Handlers ---
    function addSection(type: SectionType) {
        const newSection: Section = {
            id: crypto.randomUUID(),
            type,
            content: {}
        };
        setSections([...sections, newSection]);
    }

    function updateSectionContent(id: string, content: Record<string, any>) {
        setSections(sections.map(s => s.id === id ? { ...s, content: { ...s.content, ...content } } : s));
    }

    function deleteSection(id: string) {
        setSections(sections.filter(s => s.id !== id));
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSections(prev => {
                const oldIndex = prev.findIndex(s => s.id === active.id);
                const newIndex = prev.findIndex(s => s.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    }

    return (
        <div className="flex-1 flex gap-6">
            {/* Main Canvas */}
            <div className="flex-1 overflow-y-auto space-y-6">

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
                    {locale !== 'tr' && (
                        <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded ml-2 self-center">
                            Editing {locale.toUpperCase()} translation
                        </span>
                    )}
                </div>

                {/* Cover Image */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <label className="block text-xs uppercase text-gray-400 font-bold mb-2">Cover Image</label>
                    <div className="relative">
                        {page.cover_image ? (
                            <div className="relative group">
                                <img
                                    src={page.cover_image}
                                    alt="Cover"
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('cover-upload') as HTMLInputElement;
                                            input?.click();
                                        }}
                                        className="bg-white text-gray-800 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                                    >
                                        Change Image
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm('Remove cover image and delete from storage?')) {
                                                await deletePageStorage(page.id);
                                                setPage({ ...page, cover_image: null, cover_thumb: null });
                                            }
                                        }}
                                        className="bg-red-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => {
                                    const input = document.getElementById('cover-upload') as HTMLInputElement;
                                    input?.click();
                                }}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                            >
                                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto group-hover:bg-indigo-100 transition-colors">
                                    <span className="text-2xl group-hover:scale-110 transition-transform">📷</span>
                                </div>
                                <p className="text-sm font-medium text-gray-600 mt-3">Click to upload cover image</p>
                                <p className="text-xs text-gray-400 mt-1">Recommended size: 1200x630 (WebP supported)</p>
                            </div>
                        )}

                        <input
                            id="cover-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const formData = new FormData();
                                formData.append('file', file);

                                setIsCheckingSlug(true);

                                // NEW: If there's an existing image, we could clean it up first
                                // But to avoid losing the old one if upload fails, we do it after successful upload
                                const result = await uploadCoverImage(page.id, formData);

                                if (result.success && result.url) {
                                    // Optional: Cleanup previous files now that we have the new one
                                    // Actually, we should only delete the OLD ones, but deletePageStorage wipes the folder
                                    // In our case, we only have cover and thumb, so it's okay if we don't mind a brief moment
                                    // where the old one is still there.
                                    // BETTER: uploadCoverImage should probably handle the "overwrite" by using same name or cleaning up.
                                    // For now, let's just update the state.
                                    setPage({
                                        ...page,
                                        cover_image: result.url,
                                        cover_thumb: result.thumbUrl || null
                                    });
                                } else if (result.error) {
                                    alert(result.error);
                                }
                                setIsCheckingSlug(false);
                            }}
                        />
                    </div>
                </div>

                {/* Title & Description */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Page Title</label>
                            <input
                                value={locale === 'tr' ? page.title : getLocalized('title', page.title)}
                                onChange={e => {
                                    const newTitle = e.target.value;
                                    setLocalized('title', newTitle);
                                    // Slug auto-generation is now handled by unique path logic in useEffect
                                }}
                                className="text-3xl font-bold w-full outline-none bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 pb-1 transition-colors"
                                placeholder="Untitled Page"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs uppercase text-gray-400 font-bold">Path / Slug</label>
                            </div>
                            <div className="relative">
                                <input
                                    value={locale === 'tr' ? page.path : getLocalized('path', page.path)}
                                    onChange={e => {
                                        setLocalized('path', e.target.value);
                                        // Lock slug when user manually edits it
                                        if (!slugLocked) setSlugLocked(true);
                                    }}
                                    className={`text-sm text-gray-600 w-full outline-none font-mono bg-gray-50 rounded px-3 py-2 ${slugError && locale === 'tr' ? 'border border-red-300 bg-red-50' : ''}`}
                                    placeholder="/example-page"
                                />
                                {isCheckingSlug && locale === 'tr' && (
                                    <div className="absolute right-3 top-2.5 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                )}
                            </div>
                            {slugError && locale === 'tr' && (
                                <p className="text-xs text-red-500 mt-1 font-bold">⚠️ {slugError}</p>
                            )}
                            {!slugLocked && !slugError && locale === 'tr' && !isCheckingSlug && (
                                <p className="text-xs text-indigo-500 mt-1 font-medium">✨ Auto-generating from title</p>
                            )}
                            {slugLocked && !slugError && locale === 'tr' && !isCheckingSlug && (
                                <p className="text-xs text-green-600 mt-1 font-medium italic">✓ Unique path verified</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-1">
                                Description <span className="text-gray-300 font-normal">(SEO meta description)</span>
                            </label>
                            <textarea
                                value={locale === 'tr' ? (page.description || '') : getLocalized('description', page.description || '')}
                                onChange={e => setLocalized('description', e.target.value)}
                                className="w-full outline-none resize-none bg-gray-50 rounded px-3 py-2 text-sm"
                                placeholder="Brief description of this page (recommended: 150-160 characters)"
                                rows={2}
                                maxLength={200}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {(locale === 'tr' ? page.description?.length : getLocalized('description', page.description)?.length) || 0}/160 characters
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rich Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <label className="block text-xs uppercase text-gray-400 font-bold mb-3">Main Content</label>
                    <div
                        contentEditable
                        suppressContentEditableWarning
                        className="min-h-[200px] outline-none prose max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200 focus:border-indigo-400 focus:bg-white transition-colors"
                        dangerouslySetInnerHTML={{
                            __html: locale === 'tr' ? (page.content || '') : (getLocalized('content', page.content) || '')
                        }}
                        onBlur={e => setLocalized('content', e.currentTarget.innerHTML)}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                        Tip: Use Ctrl+B for bold, Ctrl+I for italic
                    </p>
                </div>

                {/* Sections */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">Additional Sections</h3>
                        <span className="text-xs text-gray-400">{sections.length} section(s)</span>
                    </div>

                    {sections.length > 0 ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3">
                                    {sections.map(section => (
                                        <SortableSection
                                            key={section.id}
                                            section={section}
                                            onUpdate={updateSectionContent}
                                            onDelete={deleteSection}
                                            products={products}
                                            categories={categories}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                            No additional sections. Add one below.
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 flex flex-col gap-4 sticky top-0 h-fit">
                {/* Actions */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold">Actions</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${page.is_published ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-xs text-gray-500">{page.is_published ? 'Published' : 'Draft'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || !!slugError}
                        className={`w-full py-2.5 rounded-lg font-medium text-white transition-colors ${saving || !!slugError ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        onClick={() => setPage({ ...page, is_published: !page.is_published })}
                        className="w-full mt-2 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 text-gray-700"
                    >
                        {page.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                        onClick={async () => {
                            if (!confirm('Delete this page?')) return;
                            setDeleting(true);
                            const result = await deletePage(page.id);
                            if (result?.error) {
                                alert('Error: ' + result.error);
                                setDeleting(false);
                            } else {
                                router.push('/admin/pages');
                            }
                        }}
                        disabled={deleting}
                        className="w-full mt-2 py-2 border border-red-200 rounded-lg text-sm hover:bg-red-50 text-red-600 disabled:opacity-50"
                    >
                        {deleting ? 'Deleting...' : 'Delete Page'}
                    </button>
                </div>

                {/* Page Settings */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold mb-4">Page Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-2">Parent Page</label>
                            <select
                                value={page.parent_id || ''}
                                onChange={e => setPage({ ...page, parent_id: e.target.value || null })}
                                className="block w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border"
                            >
                                <option value="">(No Parent)</option>
                                {allPages
                                    .filter(p => p.id !== page.id)
                                    .map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-2">Menu Location</label>
                            <select
                                value={page.menu_location || 'main'}
                                onChange={e => setPage({ ...page, menu_location: e.target.value as MenuLocation })}
                                className="block w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border capitalize"
                            >
                                {['main', 'footer', 'deep', 'hidden'].map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Add Section */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold mb-4">Add Section</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {SECTION_TYPES.map(({ type, label, icon }) => (
                            <button
                                key={type}
                                onClick={() => addSection(type)}
                                className="p-3 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 text-left text-sm transition-colors"
                            >
                                <span className="mr-1">{icon}</span> {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
