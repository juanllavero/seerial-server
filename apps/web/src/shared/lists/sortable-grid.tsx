import { useEffect, useRef, useState } from 'react';
import { SortableItem, SortableListContext } from './sortable-item';

interface SortableEntity {
  id: string;
}

interface SortableGridProps<T extends SortableEntity> {
  items: T[];
  onDragEnd: (sourceIndex: number, destinationIndex: number) => void;
  renderItem: (item: T) => React.ReactNode;
}

export function SortableGrid<T extends SortableEntity>({
  items,
  onDragEnd,
  renderItem,
}: SortableGridProps<T>) {
  const onDragEndRef = useRef(onDragEnd);
  const sourceIndexRef = useRef<number | null>(null);
  const pointerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRectRef = useRef<{ width: number; height: number } | null>(null);
  const [sourceIndex, setSourceIndex] = useState<number | null>(null);
  const [pointerPosition, setPointerPosition] = useState<{ x: number; y: number } | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [draggedRect, setDraggedRect] = useState<{ width: number; height: number } | null>(null);

  const beginDrag = (
    nextSourceIndex: number,
    nextPointerPosition: { x: number; y: number },
    nextDraggedRect: { width: number; height: number },
  ) => {
    sourceIndexRef.current = nextSourceIndex;
    pointerPositionRef.current = nextPointerPosition;
    draggedRectRef.current = nextDraggedRect;
    setSourceIndex(nextSourceIndex);
    setPointerPosition(nextPointerPosition);
    setTargetIndex(nextSourceIndex);
    setDraggedRect(nextDraggedRect);
  };

  const updateDrag = (payload: {
    pointerPosition: { x: number; y: number };
    targetIndex: number | null;
  }) => {
    pointerPositionRef.current = payload.pointerPosition;
    setPointerPosition(payload.pointerPosition);
    setTargetIndex(payload.targetIndex);
  };

  const endDrag = () => {
    sourceIndexRef.current = null;
    pointerPositionRef.current = null;
    draggedRectRef.current = null;
    setSourceIndex(null);
    setPointerPosition(null);
    setTargetIndex(null);
    setDraggedRect(null);
  };

  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (sourceIndexRef.current === null) return;

      const element = document.elementFromPoint(event.clientX, event.clientY);
      const targetElement = element?.closest<HTMLElement>('[data-sortable-item-index]');
      const destinationIndex = Number(targetElement?.dataset.sortableItemIndex);

      pointerPositionRef.current = { x: event.clientX, y: event.clientY };
      setPointerPosition({ x: event.clientX, y: event.clientY });
      setTargetIndex(Number.isNaN(destinationIndex) ? null : destinationIndex);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const currentSourceIndex = sourceIndexRef.current;
      if (currentSourceIndex === null) return;

      const element = document.elementFromPoint(event.clientX, event.clientY);
      const targetElement = element?.closest<HTMLElement>('[data-sortable-item-index]');
      const destinationIndex = Number(targetElement?.dataset.sortableItemIndex);

      sourceIndexRef.current = null;
      pointerPositionRef.current = null;
      draggedRectRef.current = null;
      setSourceIndex(null);
      setPointerPosition(null);
      setTargetIndex(null);
      setDraggedRect(null);

      if (Number.isNaN(destinationIndex)) return;
      if (currentSourceIndex === destinationIndex) return;

      onDragEndRef.current(currentSourceIndex, destinationIndex);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const contextValue = {
    sourceIndex,
    targetIndex,
    pointerPosition,
    draggedRect,
    beginDrag,
    updateDrag,
    endDrag,
  };

  return (
    <SortableListContext.Provider value={contextValue}>
      {sourceIndex !== null && pointerPosition && draggedRect && items[sourceIndex] && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: draggedRect.width,
            height: draggedRect.height,
            transform: `translate3d(${pointerPosition.x + 12}px, ${pointerPosition.y + 12}px, 0) scale(1.02)`,
            zIndex: 9999,
            pointerEvents: 'none',
            opacity: 0.96,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
            borderRadius: '0.75rem',
          }}
        >
          {renderItem(items[sourceIndex])}
        </div>
      )}
      {items?.map((item, index) => (
        <SortableItem key={item.id} id={item.id} index={index}>
          {renderItem(item)}
        </SortableItem>
      ))}
    </SortableListContext.Provider>
  );
}
