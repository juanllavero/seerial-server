import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect } from 'react';
import { SortableItem } from './sortable-item';

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
  useEffect(() => {
    return monitorForElements({
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0];
        if (!target) return;

        const sourceData = source.data as { id: string; index: number };
        const targetData = target.data as { id: string; index: number };

        if (sourceData.id === targetData.id) return;

        const sourceIndex = sourceData.index;
        const destinationIndex = targetData.index;

        onDragEnd(sourceIndex, destinationIndex);
      },
    });
  }, [onDragEnd]);

  return (
    items &&
    items.map((item, index) => (
      <SortableItem key={item.id} id={item.id} index={index}>
        {renderItem(item)}
      </SortableItem>
    ))
  );
}
