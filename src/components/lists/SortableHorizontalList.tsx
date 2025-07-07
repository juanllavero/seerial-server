import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableItem } from './SortableItem'
import HorizontalList from './HorizontalList'

interface SortableHorizontalListProps {
  title: string
  items: any[]
  onDragEnd: (event: any) => void
  renderItem: (item: any) => React.ReactNode
}

export function SortableHorizontalList({
  title,
  items,
  onDragEnd,
  renderItem,
}: SortableHorizontalListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={horizontalListSortingStrategy}
      >
        <HorizontalList title={title}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableItem>
          ))}
        </HorizontalList>
      </SortableContext>
    </DndContext>
  )
}
