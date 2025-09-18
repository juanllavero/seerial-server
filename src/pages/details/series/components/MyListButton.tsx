import { Button } from '@/components/ui/button'
import { RemoveFromListIcon, AddToListIcon } from '@/components/ui/IconLibrary'
import { useAuth } from '@/context/auth.context'
import { authenticatedFetch } from '@/lib/auth'
import { authenticatedFetcher } from '@/utils/utils'
import { t } from 'i18next'
import useSWR from 'swr'

interface MyListButtonProps {
  serverUrl: string
  seriesId: string
}

function MyListButton({ serverUrl, seriesId }: MyListButtonProps) {
  const { user } = useAuth()
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
