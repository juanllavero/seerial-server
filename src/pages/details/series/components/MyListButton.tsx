import { Button } from '@/components/ui/button'
import { RemoveFromListIcon, AddToListIcon } from '@/components/ui/IconLibrary'
import { fetcher } from '@/utils/utils'
import { t } from 'i18next'
import useSWR from 'swr'

interface MyListButtonProps {
  serverUrl: string
  seriesId: string
}

function MyListButton({ serverUrl, seriesId }: MyListButtonProps) {
  // Get if show is in My List
  const { data: inMyList, mutate: mutateInMyList } = useSWR(
    `${serverUrl}/isShowInMyList?seriesId=${seriesId}`,
    fetcher,
  )

  const toggleMyList = () => {
    fetch(`${serverUrl}/updateSeriesMyList`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seriesId: seriesId,
      }),
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
