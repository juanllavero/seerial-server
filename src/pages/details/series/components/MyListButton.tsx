import { Button } from '@/components/ui/button'
import { AddToListIcon, RemoveFromListIcon } from '@/components/ui/IconLibrary'
import { useServerStore } from '@/context/server.context'
import { authenticatedFetch } from '@/lib/auth'
import { authenticatedFetcher } from '@/utils/utils'
import { t } from 'i18next'
import useSWR from 'swr'

interface MyListButtonProps {
  serverUrl: string
  seriesId: string
}

function MyListButton({ serverUrl, seriesId }: MyListButtonProps) {
  const user = useServerStore((state) => state.currentUser)
  // Get if show is in My List
  const { data: inMyList, mutate: mutateInMyList } = useSWR(
    `${serverUrl}/isShowInMyList?seriesId=${seriesId}&userId=${user?.id}`,
    authenticatedFetcher,
  )

  const toggleMyList = () => {
    authenticatedFetch(`${serverUrl}/updateSeriesMyList`, 'POST', {
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
