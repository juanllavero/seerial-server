import { Button } from '@/components/ui/button'
import { RemoveFromListIcon, AddToListIcon } from '@/components/ui/IconLibrary'
import { fetcher } from '@/utils/utils'
import { t } from 'i18next'
import useSWR from 'swr'

interface MyListButtonProps {
  serverIP: string
  seriesId: string
}

function MyListButton({ serverIP, seriesId }: MyListButtonProps) {
  // Get if show is in My List
  const { data: inMyList, mutate: mutateInMyList } = useSWR(
    `https://${serverIP}/isShowInMyList?seriesId=${seriesId}`,
    fetcher,
  )

  const toggleMyList = () => {
    fetch(`https://${serverIP}/updateSeriesMyList`, {
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
          ? t('addToMyList')
          : t('removeFromMyList')
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
