import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useEffect } from 'react'
import { SortableItem } from './SortableItem'

interface SortableGridProps {
  items: any[]
  onDragEnd: (sourceIndex: number, destinationIndex: number) => void
  renderItem: (item: any) => React.ReactNode
}

export function SortableGrid({
  items,
  onDragEnd,
  renderItem,
}: SortableGridProps) {
  useEffect(() => {
    return monitorForElements({
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0]
        if (!target) return

        const sourceData = source.data as { id: string; index: number }
        const targetData = target.data as { id: string; index: number }

        if (sourceData.id === targetData.id) return

        const sourceIndex = sourceData.index
        const destinationIndex = targetData.index

        onDragEnd(sourceIndex, destinationIndex)
      },
    })
  }, [onDragEnd])

  return (
    items &&
    items.map((item, index) => (
      <SortableItem key={item.id} id={item.id} index={index}>
        {renderItem(item)}
      </SortableItem>
    ))
  )
}
