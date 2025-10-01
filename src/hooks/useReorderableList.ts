import { useServerStore } from '@/context/server.context'
import { LibraryItem } from '@/data/interfaces/Media'
import { authenticatedFetch } from '@/lib/auth'
import { arrayMove } from '@dnd-kit/sortable'
import { useEffect, useState } from 'react'

export function useReorderableList(
  swrData: LibraryItem[] | undefined,
  libraryId: string,
  mutate: () => void,
) {
  const serverUrl = useServerStore((state) => state.serverUrl)
  const [items, setItems] = useState<LibraryItem[]>([])

  useEffect(() => {
    if (swrData) {
      setItems(swrData)
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
        await authenticatedFetch(`${serverUrl}/library/reorder`, 'POST', {
          libraryId,
          orderedItems: orderedItemsForApi,
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
