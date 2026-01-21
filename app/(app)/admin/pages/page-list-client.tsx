'use client';

import { useState, useEffect, useId, useMemo, memo, useCallback, useTransition, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation,
    useDroppable,
    MeasuringStrategy
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updatePageOrder, deletePage, createPage, checkPathAvailability, getUniquePath } from '@/app/actions/cms';
import { generateSlug } from '@/lib/slug';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Page, MenuLocation } from '@/types';

// --- Constants ---
const MENU_GROUPS: MenuLocation[] = ['main', 'footer', 'deep', 'hidden'];

// --- Components ---

const SortableItem = memo(function SortableItem({
    page,
    hasChildren,
    onNavigate,
    onDelete,
    isOverlay = false
}: {
    page: Page,
    hasChildren: boolean,
    onNavigate: (page: Page) => void,
    onDelete: (page: Page) => void,
    isOverlay?: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: page.id,
        data: { type: 'Page', page },
        animateLayoutChanges: () => false
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    if (isOverlay) {
        return (
            <div className="bg-white shadow-xl opacity-90 border rounded ring-2 ring-indigo-500 w-[600px] overflow-hidden">
                <table className="w-full table-fixed">
                    <tbody>
                        <tr className="bg-indigo-50">
                            <td className="px-6 py-4 w-10 text-gray-600">⋮⋮</td>
                            <td className="px-6 py-4 font-mono text-sm text-indigo-700 font-bold truncate">{page.path}</td>
                            <td className="px-6 py-4 font-medium truncate">{page.title}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <tr ref={setNodeRef} style={style} className="hover:bg-gray-50 group bg-white border-b border-gray-100 last:border-0 relative">
            <td className="px-6 py-4 w-10 cursor-move text-gray-400 group-hover:text-gray-600 touch-none" {...attributes} {...listeners}>
                ⋮⋮
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-indigo-600 font-medium">
                        {page.path}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4 font-medium flex items-center justify-between">
                <div>
                    <span>{page.title}</span>
                    <span className="text-xs text-gray-400 ml-2">({JSON.stringify(page.locales)?.length > 2 ? 'Multi-lang' : 'Single'})</span>
                </div>
                {/* Subpage Action / Indicator */}
                <button
                    onClick={(e) => { e.preventDefault(); onNavigate(page); }}
                    className={`text-xs px-2 py-1 rounded border flex items-center gap-1 transition-colors
                        ${hasChildren
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    {hasChildren ? '📂 Open Subpages' : '📁 Add Subpages'}
                </button>
            </td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-xs ${page.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {page.is_published ? 'Published' : 'Draft'}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <Link href={`/admin/pages/${page.id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                        Edit
                    </Link>
                    <button
                        onClick={(e) => { e.preventDefault(); onDelete(page); }}
                        className="text-red-400 hover:text-red-600 text-sm"
                        title="Delete page"
                    >
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    );
});

const SortableGroup = memo(function SortableGroup({
    groupName,
    pages,
    allPages,
    onNavigate,
    onDelete,
    showHeader = true
}: {
    groupName: string,
    pages: Page[],
    allPages: Page[],
    onNavigate: (page: Page) => void,
    onDelete: (page: Page) => void,
    showHeader?: boolean
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: groupName,
        data: { type: 'Group', groupName }
    });

    const itemsIds = useMemo(() => pages.map(p => p.id), [pages]);

    const getHasChildren = useCallback((pageId: string) => {
        return allPages.some(p => p.parent_id === pageId);
    }, [allPages]);

    return (
        <div className="mb-8">
            {showHeader && (
                <h3 className="text-lg font-bold mb-3 capitalize text-gray-700 flex items-center gap-2">
                    {groupName} Menu
                    <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{pages.length}</span>
                </h3>
            )}
            <div
                ref={setNodeRef}
                className={`bg-white rounded-lg shadow-sm border overflow-hidden min-h-[100px] transition-colors ${isOver ? 'border-indigo-500 bg-indigo-50/10' : 'border-gray-200'}`}
            >
                <table className="w-full text-left table-fixed">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
                        <tr>
                            <th className="px-6 py-3 w-10"></th>
                            <th className="px-6 py-3 w-1/4">Slug</th>
                            <th className="px-6 py-3 w-1/3">Sayfa Adı</th>
                            <th className="px-6 py-3 w-32">Durum</th>
                            <th className="px-6 py-3 w-24">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 min-h-[50px]">
                        <SortableContext
                            items={itemsIds}
                            strategy={verticalListSortingStrategy}
                        >
                            {pages.map((page) => (
                                <SortableItem
                                    key={page.id}
                                    page={page}
                                    hasChildren={getHasChildren(page.id)}
                                    onNavigate={onNavigate}
                                    onDelete={onDelete}
                                />
                            ))}
                        </SortableContext>
                        {pages.length === 0 && (
                            <tr>
                                <td className="px-6 py-8 text-center text-gray-400 italic" colSpan={5}>
                                    Drag pages here to add to this list
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

// --- Main Component ---

export function PageListClient({ initialPages }: { initialPages: Page[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [items, setItems] = useState<Page[]>(initialPages);
    // viewParentId is now derived from URL ?parent=ID
    const viewParentId = searchParams.get('parent');

    const itemsRef = useRef(items);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        setItems(initialPages);
    }, [initialPages]);

    useEffect(() => { itemsRef.current = items; }, [items]);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const dndId = useId();
    const [isPending, startTransition] = useTransition();

    useEffect(() => { setIsMounted(true); }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- Navigation Logic ---
    const handleNavigation = useCallback((page: Page) => {
        router.push(`/admin/pages?parent=${page.id}`);
    }, [router]);

    const handleBack = useCallback(() => {
        if (!viewParentId) return;
        const currentPage = items.find(p => p.id === viewParentId);
        if (currentPage?.parent_id) {
            router.push(`/admin/pages?parent=${currentPage.parent_id}`);
        } else {
            router.push('/admin/pages');
        }
    }, [items, viewParentId, router]);

    const handleRoot = useCallback(() => {
        router.push('/admin/pages');
    }, [router]);

    // --- Delete Logic ---
    const handleDelete = useCallback(async (page: Page) => {
        if (!confirm(`Are you sure you want to delete "${page.title}"? This action cannot be undone.`)) return;

        const result = await deletePage(page.id);
        if (result?.error) {
            alert('Error: ' + result.error);
        } else {
            // Remove from local state
            setItems(prev => prev.filter(p => p.id !== page.id));
        }
    }, []);
    const [createSlugError, setCreateSlugError] = useState('');
    const [createFormError, setCreateFormError] = useState('');
    const [createTitle, setCreateTitle] = useState('');
    const [createPath, setCreatePath] = useState('');
    const [isPathLocked, setIsPathLocked] = useState(false);
    const [isCheckingSlug, setIsCheckingSlug] = useState(false);

    // Debounced Slug Generation for Create Form
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!createTitle || isPathLocked) return;

            setIsCheckingSlug(true);
            const baseSlug = generateSlug(createTitle);
            const uniquePath = await getUniquePath(baseSlug);
            setCreatePath(uniquePath);
            setCreateSlugError('');
            setIsCheckingSlug(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [createTitle, isPathLocked]);

    // Separate debounce for manual path validation
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!createPath || !isPathLocked) {
                if (!createPath) setCreateSlugError('');
                return;
            }

            setIsCheckingSlug(true);
            const { available } = await checkPathAvailability(createPath);
            if (!available) {
                setCreateSlugError('Slug taken');
            } else {
                setCreateSlugError('');
            }
            setIsCheckingSlug(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [createPath, isPathLocked]);

    // --- Create Page Logic ---
    const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCreateFormError('');

        if (createSlugError) return;

        const form = e.currentTarget;
        const formData = new FormData(form);
        const title = formData.get('title') as string;
        const path = formData.get('path') as string;

        if (!title || !path) {
            setCreateFormError('Please fill all fields.');
            return;
        }

        setIsCreating(true);

        // Add parent_id to form data if we're in a subpage view
        if (viewParentId) {
            formData.set('parent_id', viewParentId);
            // Also inherit menu_location from parent
            const parent = items.find(p => p.id === viewParentId);
            if (parent?.menu_location) {
                formData.set('menu_location', parent.menu_location);
            }
        }

        const result = await createPage(formData);
        if (result?.error) {
            setCreateFormError(result.error);
        } else {
            form.reset();
            setCreateTitle('');
            setCreatePath('');
            setIsPathLocked(false);
            setCreateSlugError('');
        }
        setIsCreating(false);
    }, [viewParentId, items, createSlugError]);

    // --- Filter Pages for Current View ---
    const displayedPages = useMemo(() => {
        const sorted = [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        if (viewParentId) {
            return sorted.filter(p => p.parent_id === viewParentId);
        } else {
            return sorted.filter(p => !p.parent_id);
        }
    }, [items, viewParentId]);

    // Grouping
    const groupedPages = useMemo(() => {
        const groups: Record<MenuLocation, Page[]> = {
            main: [], footer: [], deep: [], hidden: []
        };
        displayedPages.forEach(p => {
            const g = (p.menu_location || 'main') as MenuLocation;
            if (groups[g]) groups[g].push(p);
            else if (groups['main']) groups['main'].push(p);
        });
        return groups;
    }, [displayedPages]);

    // --- Breadcrumbs ---
    const breadcrumbs = useMemo((): Page[] => {
        if (!viewParentId) return [];
        const crumbs: Page[] = [];
        let current = items.find(p => p.id === viewParentId);
        while (current) {
            crumbs.unshift(current);
            current = items.find(p => p.id === current?.parent_id);
        }
        return crumbs;
    }, [viewParentId, items]);


    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;
        if (activeId === overId) return;

        // --- FIX: Define isGroupDrop HERE so checking it inside closure works ---
        const isGroupDrop = (MENU_GROUPS as readonly string[]).includes(overId);

        setItems((prev) => {
            const activeIndex = prev.findIndex(p => p.id === activeId);
            const overIndex = prev.findIndex(p => p.id === overId);

            if (activeIndex === -1) return prev;

            let targetGroup: MenuLocation = prev[activeIndex].menu_location || 'main';

            if (isGroupDrop) {
                targetGroup = overId as MenuLocation;
            } else if (overIndex !== -1) {
                targetGroup = prev[overIndex].menu_location || 'main';
            }

            let newItems = [...prev];

            // Update menu_location if needed
            if (newItems[activeIndex].menu_location !== targetGroup) {
                newItems[activeIndex] = { ...newItems[activeIndex], menu_location: targetGroup };
            }

            // Apply arrayMove if dropping on an item (not a group)
            if (overIndex !== -1 && !isGroupDrop && activeIndex !== overIndex) {
                newItems = arrayMove(newItems, activeIndex, overIndex);
            }

            // --- FIX: Update sort_order values for items in the affected group ---
            // This prevents displayedPages from re-sorting to old order
            const itemsInGroup = newItems.filter(p =>
                (p.menu_location || 'main') === targetGroup &&
                p.parent_id === viewParentId
            );

            // Create a map of new sort_order values
            const sortOrderMap = new Map<string, number>();
            itemsInGroup.forEach((item, idx) => {
                sortOrderMap.set(item.id, idx);
            });

            // Apply new sort_order to all items
            return newItems.map(item => {
                const newSortOrder = sortOrderMap.get(item.id);
                if (newSortOrder !== undefined && (item.menu_location || 'main') === targetGroup) {
                    return { ...item, sort_order: newSortOrder };
                }
                return item;
            });
        });

        startTransition(async () => {
            const prev = itemsRef.current;
            const activeIndex = prev.findIndex(p => p.id === activeId);

            // We need to construct the payload representing the NEW state order.
            // We do a "dry run" of the move on the dataset to get the correct order.
            // This is safer than trying to read the updated React state which might be pending.

            // 1. Filter relevant list
            const item = prev.find(p => p.id === activeId);
            if (!item) return;

            // Logic: where did we drop it?
            const overIndex = prev.findIndex(p => p.id === overId);

            // Calculate new list state locally
            let newOrder = [...prev];

            // Apply move
            if (!isGroupDrop && overIndex !== -1 && activeIndex !== overIndex) {
                newOrder = arrayMove(newOrder, activeIndex, overIndex);
            }

            // Apply group change
            let targetGroup: MenuLocation = item.menu_location || 'main';
            if (isGroupDrop) targetGroup = overId as MenuLocation;
            else if (overIndex !== -1) targetGroup = prev[overIndex].menu_location || 'main';

            // Update the item in the local copy
            const newActiveIndex = newOrder.findIndex(p => p.id === activeId); // Index might have changed if arrayMove happened
            if (newActiveIndex !== -1) {
                newOrder[newActiveIndex] = { ...newOrder[newActiveIndex], menu_location: targetGroup };
            }

            // Now build payload from this hypothetical state
            // We only care about the group we moved INTO.
            const groupPages = newOrder.filter(p =>
                (p.menu_location || 'main') === targetGroup &&
                p.parent_id === viewParentId
            );

            const payload = groupPages.map((p, idx) => ({
                id: p.id,
                sort_order: idx,
                menu_location: targetGroup,
                parent_id: viewParentId
            }));

            await updatePageOrder(payload);
        });

    }, [viewParentId, items]);

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
    };

    if (!isMounted) return <div className="p-10 text-center text-gray-400">Loading...</div>;

    const activePage = activeId ? items.find(p => p.id === activeId) : null;

    // Groups to render
    // If viewParentId is set, we only show ONE list (the subpages).
    // We should infer the group name from the parent, OR just show 'Subpages'.
    // User said: "Parent page hangi menüdeyse subpage de o menü olur."
    // So we use the Parent's group.

    let renderGroups = MENU_GROUPS;
    let singleGroupMode = false;
    let singleGroupName = '';

    if (viewParentId) {
        const parent = items.find(p => p.id === viewParentId);
        const parentGroup = parent?.menu_location || 'main';
        renderGroups = [parentGroup];
        singleGroupMode = true;
        singleGroupName = parentGroup;
    }

    return (
        <div>
            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <button
                    onClick={handleRoot}
                    className={`text-sm font-bold ${!viewParentId ? 'text-gray-900 cursor-default' : 'text-indigo-600 hover:underline'}`}
                >
                    Root
                </button>
                {breadcrumbs.map((crumb, idx) => (
                    <div key={crumb.id} className="flex items-center gap-2">
                        <span className="text-gray-400">/</span>
                        <button
                            onClick={idx === breadcrumbs.length - 1 ? undefined : () => handleNavigation(crumb)}
                            className={`text-sm ${idx === breadcrumbs.length - 1 ? 'text-gray-900 font-bold cursor-default' : 'text-indigo-600 hover:underline'}`}
                        >
                            {crumb.title}
                        </button>
                    </div>
                ))}
            </div>

            {/* Inline Create Form */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h2 className="text-sm font-semibold mb-3 text-gray-700">
                    {viewParentId ? '➕ Add Subpage' : '➕ Create New Page'}
                    {viewParentId && (
                        <span className="text-xs text-gray-400 ml-2 font-normal">
                            (under {breadcrumbs[breadcrumbs.length - 1]?.title})
                        </span>
                    )}
                </h2>
                <form onSubmit={handleCreate} className="flex gap-3 items-start" noValidate>
                    <div className="flex-1">
                        <input
                            name="title"
                            value={createTitle}
                            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm"
                            placeholder="Page Title (e.g. About Us)"
                            required
                            disabled={isCreating}
                            onChange={(e) => {
                                setCreateTitle(e.target.value);
                                setCreateFormError('');
                            }}
                        />
                    </div>
                    <div className="flex-1 relative">
                        <input
                            name="path"
                            value={createPath}
                            className={`w-full bg-gray-50 border rounded px-3 py-2 text-sm ${createSlugError ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-300'}`}
                            placeholder="Slug (e.g. /about)"
                            required
                            disabled={isCreating}
                            onChange={(e) => {
                                setIsPathLocked(true);
                                setCreatePath(e.target.value);
                                setCreateFormError('');
                            }}
                        />
                        {isCheckingSlug && (
                            <div className="absolute right-3 top-2.5 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                        )}
                        {createSlugError && (
                            <p className="text-xs text-red-500 mt-1 font-bold absolute">⚠️ {createSlugError}</p>
                        )}
                        {!createSlugError && !isPathLocked && createTitle && (
                            <p className="text-xs text-indigo-500 mt-1 font-medium absolute">✨ Auto-generated</p>
                        )}
                        {createFormError && !createSlugError && (
                            <p className="text-xs text-red-500 mt-1 font-bold absolute">⚠️ {createFormError}</p>
                        )}
                    </div>
                    {!viewParentId && (
                        <select name="menu_location" className="bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm" disabled={isCreating}>
                            <option value="main">Main Menu</option>
                            <option value="footer">Footer</option>
                            <option value="deep">Deep (Sub)</option>
                            <option value="hidden">Hidden</option>
                        </select>
                    )}
                    <button
                        type="submit"
                        disabled={isCreating || !!createSlugError}
                        className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? 'Creating...' : 'Create'}
                    </button>
                </form>
            </div>

            <DndContext
                id={dndId}
                sensors={sensors}
                collisionDetection={closestCenter}
                measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {renderGroups.map((group) => {
                    // In single group mode, we might want to list ALL displayed pages in this one container
                    // even if their data says different group (due to bad data).
                    // But 'groupedPages' already groups them.
                    // If we have mixed data, it might be hidden.
                    // Let's assume data is clean or we only render what matches parent group.

                    // Actually, if we are in subpage view, we want to show ALL children regardless of their internal 'menu_location'.
                    // So we should ignore 'groupedPages' splitting and just pass 'displayedPages'.

                    const pages = singleGroupMode ? displayedPages : groupedPages[group];

                    return (
                        <SortableGroup
                            key={group}
                            groupName={group}
                            pages={pages}
                            allPages={items}
                            onNavigate={handleNavigation}
                            onDelete={handleDelete}
                            showHeader={!singleGroupMode}
                        />
                    );
                })}

                {createPortal(
                    <DragOverlay dropAnimation={dropAnimation}>
                        {activePage ? <SortableItem page={activePage} hasChildren={false} onNavigate={() => { }} onDelete={() => { }} isOverlay /> : null}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </div>
    );
}
