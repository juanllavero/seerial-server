import { createContext, useContext } from 'react';

export interface SortableListContextValue {
    sourceIndex: number | null;
    targetIndex: number | null;
    pointerPosition: { x: number; y: number } | null;
    draggedRect: { width: number; height: number } | null;
    beginDrag: (
        sourceIndex: number,
        pointerPosition: { x: number; y: number },
        draggedRect: { width: number; height: number },
    ) => void;
    updateDrag: (payload: {
        pointerPosition: { x: number; y: number };
        targetIndex: number | null;
    }) => void;
    endDrag: () => void;
}

export const SortableListContext = createContext<SortableListContextValue | null>(null);

export function useSortableListContext() {
    const context = useContext(SortableListContext);

    if (!context) {
        throw new Error('useSortableListContext must be used within SortableListContext');
    }

    return context;
}