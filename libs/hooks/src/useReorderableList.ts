import { API, useCreate } from '@seerial/api'
import type { LibraryItem } from '@seerial/domain'
import { useEffect, useState } from 'react'

export function useReorderableList(
  data: LibraryItem[] | undefined,
  libraryId: string,
  mutate: () => void | Promise<void>,
) {
  const [items, setItems] = useState<LibraryItem[]>([])
  const { create } = useCreate<unknown>()

  useEffect(() => {
    if (data) {
      setItems(data)
    }
  }, [data])

  async function handleDragEnd(sourceIndex: number, destinationIndex: number) {
    const hasInvalidIndex =
      sourceIndex === destinationIndex ||
      sourceIndex < 0 ||
      destinationIndex < 0 ||
      sourceIndex >= items.length ||
      destinationIndex >= items.length

    if (hasInvalidIndex) return

    const newItems = [...items]
    const [movedItem] = newItems.splice(sourceIndex, 1)
    if (!movedItem) return
    newItems.splice(destinationIndex, 0, movedItem)

    setItems(newItems)

    const orderedItemsForApi = newItems.map((item) => ({
      id: item.id,
      type: item.type,
    }))

    try {
      await create(API.libraries.reorderItems(libraryId), {
        libraryId,
        orderedItems: orderedItemsForApi,
      })
    } catch (_error) {
      if (data) {
        setItems(data)
      }
    } finally {
      await mutate()
    }
  }

  return { items, handleDragEnd }
}
