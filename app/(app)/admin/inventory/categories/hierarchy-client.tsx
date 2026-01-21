'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCategory } from '@/types';
import { updateCategoryOrder } from '@/app/actions/inventory';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
    categories: ProductCategory[];
}

function SortableCategoryItem({
    category,
    depth = 0,
    allCategories,
    onOrderChange
}: {
    category: ProductCategory,
    depth?: number,
    allCategories: ProductCategory[],
    onOrderChange: (parentId: string | null, newItems: ProductCategory[]) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    const children = allCategories.filter(c => c.parent_id === category.id)
        .sort((a, b) => a.sort_order - b.sort_order);

    return (
        <div ref={setNodeRef} style={style} className="select-none">
            <div
                className={`flex items-center justify-between p-2 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors ${depth > 0 ? 'pl-8 border-indigo-50' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500"
                    >
                        ⋮⋮
                    </button>
                    <div className='flex items-center gap-2'>
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-xs text-gray-400 font-mono">/{category.slug}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">Sıra: {category.sort_order}</span>
                    <Link
                        href={`/admin/inventory/categories/${category.id}?type=${category.type}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                        Düzenle
                    </Link>
                </div>
            </div>

            {children.length > 0 && (
                <div className="bg-gray-50/30">
                    <SortableCategoryLevel
                        categories={allCategories}
                        parentId={category.id}
                        depth={depth + 1}
                        onOrderChange={onOrderChange}
                    />
                </div>
            )}
        </div>
    );
}

function SortableCategoryLevel({
    categories,
    parentId,
    depth,
    onOrderChange
}: {
    categories: ProductCategory[],
    parentId: string | null,
    depth: number,
    onOrderChange: (parentId: string | null, newItems: ProductCategory[]) => void
}) {
    const levelItems = categories.filter(c => c.parent_id === parentId)
        .sort((a, b) => a.sort_order - b.sort_order);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = levelItems.findIndex(i => i.id === active.id);
            const newIndex = levelItems.findIndex(i => i.id === over.id);

            const newOrder = arrayMove(levelItems, oldIndex, newIndex);

            // Call parent's handler to update the central state
            onOrderChange(parentId, newOrder);
        }
    }

    if (levelItems.length === 0) return null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={levelItems.map(c => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <div>
                    {levelItems.map(category => (
                        <SortableCategoryItem
                            key={category.id}
                            category={category}
                            depth={depth}
                            allCategories={categories}
                            onOrderChange={onOrderChange}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

export default function CategoryHierarchyClient({ categories: initialCategories }: Props) {
    const [categories, setCategories] = useState(initialCategories);

    // Sync with server props
    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    async function handleOrderChange(parentId: string | null, newItems: ProductCategory[]) {
        // Update local state first (Optimistic)
        const updatedItems = newItems.map((item, index) => ({
            ...item,
            sort_order: index
        }));

        setCategories(prev => {
            const newCategories = prev.map(c => {
                const updated = updatedItems.find(u => u.id === c.id);
                return updated || c;
            });
            return newCategories;
        });

        // Send to server
        const payload = updatedItems.map(item => ({
            id: item.id,
            sort_order: item.sort_order
        }));

        await updateCategoryOrder(payload);
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <SortableCategoryLevel
                categories={categories}
                parentId={null}
                depth={0}
                onOrderChange={handleOrderChange}
            />
        </div>
    );
}
