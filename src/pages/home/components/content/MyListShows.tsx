import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { Series } from '@/data/interfaces/Media'
import { authenticatedFetch } from '@/lib/auth'
import { refreshMetadata, toggleSeriesWatched } from '@/utils/ReactUtils'
import { authenticatedFetcher } from '@/utils/utils'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import HorizontalList from '../../../../components/lists/HorizontalList'
import HorizontalListSkeleton from './HorizontalListSkeleton'

interface MyListShowsProps {
  goToContent: (url: string) => void
}

function MyListShows({ goToContent }: MyListShowsProps) {
  const { t } = useTranslation()
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
  const { user, serverUrl } = useServerStore(
    (state) => ({
      user: state.currentUser,
      serverUrl: state.serverUrl,
    }),
    shallow,
  )
  const isMobile = useIsMobile()

  // Get Shows in My List
  const { data: showsInMyList, isLoading } = useSWR<Series[]>(
    serverUrl !== ''
      ? `${serverUrl}/myListSeries?userId=${user?.id ?? null}`
      : null,
    authenticatedFetcher,
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
            watched={series.watchStatus !== undefined}
            menu={{
              items: [
                {
                  separator: false,
                  items: [
                    {
                      title: t('removeFromMyList'),
                      action: () => {
                        authenticatedFetch(
                          `${serverUrl}/updateSeriesMyList`,
                          'POST',
                          {
                            seriesId: series.id,
                            userId: user?.id,
                          },
                        ).then(() => {
                          mutate((key: string) =>
                            key.startsWith(`${serverUrl}/myListSeries`),
                          )
                        })
                      },
                    },
                    {
                      title: t('updateMetadata'),
                      action: () => {
                        refreshMetadata('show', series.id)
                      },
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
                      title:
                        series.watchStatus !== undefined
                          ? t('markUnwatched')
                          : t('markWatched'),
                      action: () =>
                        user && toggleSeriesWatched(serverUrl, series, user.id),
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
            action={() => goToContent(`/details/series/${series.id}`)}
          />
        ))
      ) : (
        t('noContent')
      )}
    </HorizontalList>
  )
}

export default MyListShows
