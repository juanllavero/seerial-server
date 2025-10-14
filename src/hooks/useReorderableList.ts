import { LibraryItem } from '@/data/interfaces/Media'
import { authenticatedFetch } from '@/lib/auth'
import { useEffect, useState } from 'react'

export function useReorderableList(
  swrData: LibraryItem[] | undefined,
  libraryId: string,
  mutate: () => void,
) {
  const [items, setItems] = useState<LibraryItem[]>([])

  useEffect(() => {
    if (swrData) {
      setItems(swrData)
    }
  }, [swrData])

  async function handleDragEnd(sourceIndex: number, destinationIndex: number) {
    console.log({ sourceIndex, destinationIndex })
    if (sourceIndex === destinationIndex) return

    const newItems = [...items]
    const [movedItem] = newItems.splice(sourceIndex, 1)
    newItems.splice(destinationIndex, 0, movedItem)

    setItems(newItems)

    const orderedItemsForApi = newItems.map((item) => ({
      id: item.data.id,
      type: item.type,
    }))

    try {
      await authenticatedFetch(`/api/library/reorder`, 'POST', {
        libraryId,
        orderedItems: orderedItemsForApi,
      })
    } catch (error) {
      if (swrData) {
        setItems(swrData)
      }
    } finally {
      mutate()
    }
  }

  return { items, handleDragEnd }
}
