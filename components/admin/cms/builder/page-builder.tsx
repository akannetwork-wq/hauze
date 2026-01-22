'use client';

import { useState } from 'react';
import { Section, SectionType } from '@/types';
import SectionPanel from './section-panel';
import SectionRenderer from '@/components/site/sections';
import SectionSettings from './section-settings';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Wrapper ---
function SortableSectionWrapper({
    section,
    children,
    onDelete,
    onSelect,
    isActive
}: {
    section: Section,
    children: React.ReactNode,
    onDelete: () => void,
    onSelect: () => void,
    isActive: boolean
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={`group relative border-2 transition-all ${isActive ? 'border-indigo-500 ring-4 ring-indigo-50/50' : 'border-transparent hover:border-indigo-200'}`}
        >
            {/* Toolbar */}
            <div className={`absolute -top-10 right-0 flex items-center gap-1 bg-indigo-600 text-white p-1 rounded-t-lg shadow-lg z-20 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing hover:bg-white/20 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                </div>
                <button onClick={onSelect} className="px-2 py-1 text-xs font-bold hover:bg-white/20 rounded">EDIT</button>
                <button onClick={onDelete} className="p-1 hover:bg-red-500 rounded text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Content Preview */}
            <div className={`pointer-events-none ${isDragging ? 'opacity-50' : ''}`}>
                {children}
            </div>
        </div>
    );
}

// --- Main Builder component ---
export default function PageBuilder({
    initialSections,
    onSave
}: {
    initialSections: Section[],
    onSave: (sections: Section[]) => Promise<void>
}) {
    const [sections, setSections] = useState<Section[]>(initialSections);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleAdd = (type: SectionType) => {
        const newSection: Section = {
            id: crypto.randomUUID(),
            type,
            content: {},
            styles: { paddingTop: 'py-20', paddingBottom: 'py-20', backgroundColor: 'bg-white' }
        };
        setSections([...sections, newSection]);
        setSelectedId(newSection.id);
    };

    const handleDelete = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleUpdateSection = (id: string, updates: Partial<Section>) => {
        setSections(prev => prev.map(s => {
            if (s.id === id) {
                return {
                    ...s,
                    content: updates.content ? { ...s.content, ...updates.content } : s.content,
                    styles: updates.styles ? { ...s.styles, ...updates.styles } : s.styles
                };
            }
            return s;
        }));
    };

    const selectedSection = sections.find(s => s.id === selectedId);

    return (
        <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-2xl">

            {/* Left Sidebar: Components */}
            <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
                <SectionPanel onAdd={handleAdd} />
            </div>

            {/* Center Canvas: Live Preview */}
            <div className="flex-1 overflow-y-auto p-12 bg-gray-200/50 relative">
                <div className="max-w-5xl mx-auto space-y-4 shadow-2xl bg-white border border-gray-100 rounded-2xl overflow-hidden min-h-full">
                    {/* Header Placeholder */}
                    <div className="h-20 bg-white border-b border-gray-50 flex items-center px-8">
                        <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            <div className="min-h-[400px]">
                                {sections.map((section) => (
                                    <SortableSectionWrapper
                                        key={section.id}
                                        section={section}
                                        onDelete={() => handleDelete(section.id)}
                                        onSelect={() => setSelectedId(section.id)}
                                        isActive={selectedId === section.id}
                                    >
                                        <SectionRenderer section={section} />
                                    </SortableSectionWrapper>
                                ))}

                                {sections.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                                        <div className="text-6xl mb-4">✨</div>
                                        <p className="text-xl font-bold">Start Building Your Page</p>
                                        <p className="text-sm">Drag or click a section from the left panel</p>
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Footer Placeholder */}
                    <div className="h-40 bg-gray-900 flex flex-col justify-center px-8 relative">
                        <div className="h-6 w-48 bg-gray-800 rounded mb-4" />
                        <div className="h-4 w-64 bg-gray-800 rounded" />
                    </div>
                </div>
            </div>

            {/* Right Sidebar: Settings */}
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
                {selectedSection ? (
                    <div className="p-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Section Settings</h3>

                        <SectionSettings
                            section={selectedSection}
                            onUpdate={(updates) => handleUpdateSection(selectedSection.id, updates)}
                        />

                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <button
                                onClick={() => onSave(sections)}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                            >
                                APPLY CHANGES
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-10 text-center text-gray-400">
                        <div className="text-4xl mb-4">⚙️</div>
                        <p className="text-sm">Select a section on the canvas to edit its properties.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
