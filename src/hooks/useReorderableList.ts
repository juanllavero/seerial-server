import { useState, useEffect } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { useServerStore } from '@/context/server.context'
import { LibraryItem } from '@/data/interfaces/Media'

export function useReorderableList(
  swrData: { content: LibraryItem[] } | undefined,
  libraryId: string,
  mutate: () => void,
) {
  const serverIP = useServerStore((state) => state.serverIP)
  const [items, setItems] = useState<LibraryItem[]>([])

  useEffect(() => {
    if (swrData?.content) {
      setItems(swrData.content)
    }
  }, [swrData])

  async function handleDragEnd(event: any) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.data.id === active.id)
      const newIndex = items.findIndex((item) => item.data.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      const orderedItemsForApi = newItems.map((item) => ({
        id: item.data.id,
        type: item.type,
      }))

      try {
        await fetch(`http://${serverIP}/library/reorder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            libraryId,
            orderedItems: orderedItemsForApi,
          }),
        })
      } catch (error) {
        setItems(items)
      } finally {
        mutate()
      }
    }
  }

  return { items, handleDragEnd }
}
