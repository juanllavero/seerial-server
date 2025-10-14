import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useEffect, useRef, useState } from 'react'

interface SortableItemProps {
  id: string
  children: React.ReactNode
  index: number
}

export function SortableItem({ id, children, index }: SortableItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isOver, setIsOver] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const cleanupDraggable = draggable({
      element,
      getInitialData: () => ({ id, index }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    })

    const cleanupDropTarget = dropTargetForElements({
      element,
      getData: () => ({ id, index }),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    })

    return () => {
      cleanupDraggable()
      cleanupDropTarget()
    }
  }, [id, index])

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    cursor: isDragging ? 'grabbing' : 'grab',
    transform: isOver && !isDragging ? 'scale(1.02)' : 'scale(1)',
    transition: 'transform 0.2s ease, opacity 0.2s ease',
  }

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  )
}
