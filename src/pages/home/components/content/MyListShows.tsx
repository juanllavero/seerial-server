import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useServerStore } from '@/context/server.context'
import { Series } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'
import HorizontalList from '../../../../components/lists/HorizontalList'
import HorizontalListSkeleton from './HorizontalListSkeleton'
import { shallow } from 'zustand/shallow'
import { useDialogStore } from '@/context/dialog.context'
import { toggleSeriesWatched } from '@/utils/ReactUtils'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { useAuth } from '@/context/auth.context'

interface MyListShowsProps {
  goToContent: (url: string) => void
}

function MyListShows({ goToContent }: MyListShowsProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const {
    openIdentificationDialog,
    openEpisodesGroupDialog,
    openSeriesDialog,
  } = useDialogStore(
    (state) => ({
      openIdentificationDialog: state.openIdentificationDialog,
      openEpisodesGroupDialog: state.openEpisodesGroupDialog,
      openSeriesDialog: state.openSeriesDialog,
    }),
    shallow,
  )
  const { selectedServer, serverUrl } = useServerStore(
    (state) => ({
      selectedServer: state.selectedServer,
      serverUrl: state.serverUrl,
    }),
    shallow,
  )
  const isMobile = useIsMobile()

  // Get Shows in My List
  const { data: showsInMyList, isLoading } = useSWR<Series[]>(
    selectedServer
      ? `${serverUrl}/myListSeries?userId=${user?.id ?? null}`
      : null,
    fetcher,
  )

  return (
    <HorizontalList title={t('watchListShows')}>
      {isLoading ? (
        <HorizontalListSkeleton listType="MyListShows" />
      ) : showsInMyList && showsInMyList.length > 0 ? (
        showsInMyList.map((series: Series) => (
          <Card
            itemKey={'Home Card' + series.id}
            imgSrc={series.coverSrc}
            width={isMobile ? 130 : 180}
            aspectRatio={2 / 3}
            title={series.name}
            hidePlayButton
            watched={series.watched}
            menu={{
              items: [
                {
                  separator: false,
                  items: [
                    {
                      title: t('removeFromMyList'),
                      action: () => {
                        fetch(`${serverUrl}/updateSeriesMyList`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            seriesId: series.id,
                            userId: user?.id,
                          }),
                        }).then(() => {
                          mutate((key: string) =>
                            key.startsWith(`${serverUrl}/myListSeries`),
                          )
                        })
                      },
                    },
                    {
                      title: t('updateMetadata'),
                      action: () => console.log('Profile clicked'),
                    },
                    {
                      title: t('correctIdentification'),
                      action: () => openIdentificationDialog(series, undefined),
                    },
                    {
                      title: t('changeEpisodesGroup'),
                      action: () => openEpisodesGroupDialog(series),
                    },
                    {
                      title: series.watched
                        ? t('markUnwatched')
                        : t('markWatched'),
                      action: () => toggleSeriesWatched(serverUrl, series),
                    },
                  ],
                },
                { separator: true, items: [] },
                {
                  separator: false,
                  items: [
                    {
                      title: t('removeButton'),
                      action: () => console.log('Log out clicked'),
                    },
                  ],
                },
              ],
            }}
            subtitle={
              series.year
                ? new Date(series.year).getFullYear().toString()
                : 'N/A'
            }
            editModal={
              <Button
                variant={'ghost'}
                size={'icon'}
                onClick={(e) => {
                  e.stopPropagation()
                  openSeriesDialog(series)
                }}
              >
                <Pencil size={16} />
              </Button>
            }
            action={() =>
              goToContent(
                `/server/${selectedServer?.id}/details/series/${series.id}`,
              )
            }
          />
        ))
      ) : (
        t('noContent')
      )}
    </HorizontalList>
  )
}

export default MyListShows
