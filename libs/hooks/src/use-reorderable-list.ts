import { API, useCreate } from '@seerial/api'
import type { LibraryItem } from '@seerial/domain'
import { useCallback, useEffect, useState } from 'react'

export function useReorderableList(
  data: LibraryItem[] | undefined,
  libraryId: string,
  mutate: () => void,
) {
  const [items, setItems] = useState<LibraryItem[]>([])
  const { create } = useCreate<unknown>()
  const [itemsBox] = useState<{ current: LibraryItem[] }>(() => ({ current: [] }))
  const [dataBox] = useState<{ current: LibraryItem[] | undefined }>(() => ({ current: undefined }))
  const [mutateBox] = useState<{ current: () => void | Promise<void> }>(() => ({ current: mutate }))

  useEffect(() => {
    itemsBox.current = items
  }, [items, itemsBox])

  useEffect(() => {
    dataBox.current = data
  }, [data, dataBox])

  useEffect(() => {
    mutateBox.current = mutate
  }, [mutate, mutateBox])

  useEffect(() => {
    if (!data) {
      setItems((previousItems: LibraryItem[]) => (previousItems.length === 0 ? previousItems : []))
      return
    }

    setItems(data)
  }, [data])

  const handleDragEnd = useCallback(async (sourceIndex: number, destinationIndex: number) => {
    const currentItems = itemsBox.current

    const hasInvalidIndex =
      sourceIndex === destinationIndex ||
      sourceIndex < 0 ||
      destinationIndex < 0 ||
      sourceIndex >= currentItems.length ||
      destinationIndex >= currentItems.length

    if (hasInvalidIndex) return

    const newItems = [...currentItems]
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
      if (dataBox.current) {
        setItems(dataBox.current)
      }
    } finally {
      await mutateBox.current()
    }
  }, [create, dataBox, itemsBox, libraryId, mutateBox])

  return { items, handleDragEnd }
}
