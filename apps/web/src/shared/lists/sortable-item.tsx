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

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  index: number;
}

export function SortableItem({ id, children, index }: SortableItemProps) {
  const { sourceIndex, targetIndex, beginDrag } = useSortableListContext();
  const isDragging = sourceIndex === index;
  const showTargetMarker = targetIndex === index && sourceIndex !== index;

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.15 : 1,
    position: 'relative',
    cursor: isDragging ? 'grabbing' : 'grab',
    transform: isDragging ? 'scale(0.98)' : 'scale(1)',
    transition: 'transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease',
    userSelect: isDragging ? 'none' : 'auto',
    boxShadow: showTargetMarker ? '0 0 0 2px rgba(255, 255, 255, 0.45) inset' : 'none',
    borderRadius: '0.75rem',
  };

  return (
    <div
      data-sortable-item-id={id}
      data-sortable-item-index={index}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        beginDrag(
          index,
          { x: event.clientX, y: event.clientY },
          {
            width: event.currentTarget.getBoundingClientRect().width,
            height: event.currentTarget.getBoundingClientRect().height,
          },
        );
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      style={style}
    >
      {children}
    </div>
  );
}
