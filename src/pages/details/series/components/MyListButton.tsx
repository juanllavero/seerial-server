import { Button } from '@/components/ui/button'
import { AddToListIcon, RemoveFromListIcon } from '@/components/ui/IconLibrary'
import { API, authenticatedFetch, authenticatedFetcher } from '@/config/api'
import { useServerStore } from '@/context/server.context'
import { t } from 'i18next'
import useSWR from 'swr'

interface MyListButtonProps {
  seriesId: string
}

function MyListButton({ seriesId }: MyListButtonProps) {
  const user = useServerStore((state) => state.currentUser)
  // Get if show is in My List
  const { data: inMyList, mutate: mutateInMyList } = useSWR(
    API.myList.isSeriesInList(seriesId),
    authenticatedFetcher,
  )

  const toggleMyList = () => {
    authenticatedFetch(API.myList.series, 'POST', {
      seriesId: seriesId,
      userId: user?.id,
    }).then(() => {
      mutateInMyList()
    })
  }
  return (
    <Button
      variant={'ghost'}
      title={
        inMyList && inMyList.isInMyList
          ? t('removeFromMyList')
          : t('addToMyList')
      }
      onClick={toggleMyList}
    >
      {inMyList && inMyList.isInMyList ? (
        <RemoveFromListIcon />
      ) : (
        <AddToListIcon />
      )}
    </Button>
  )
}

export default MyListButton
