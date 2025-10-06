import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import NotFound from '@/components/NotFound'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Episode, Season } from '@/data/interfaces/Media'
import { SelectableOption } from '@/data/interfaces/Utils'
import { authenticatedFetch, authenticatedFetcher } from '@/lib/auth'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import useSWR, { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import EpisodeCard from './cards/EpisodeCard'
import EpisodeCardDetails from './cards/EpisodeCardDetails'

interface SeasonContentProps {
  seasonList: Season[]
  serverUrl: string
}

function SeasonContent({ seasonList, serverUrl }: SeasonContentProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = useServerStore((state) => state.currentUser)
  const { selectedSeasonId } = useDataStore(
    (state) => ({
      selectedSeasonId: state.selectedSeasonId,
    }),
    shallow,
  )
  const [distribution, setDistribution] = React.useState(0)
  const prevDistribution = useRef(distribution)
  const distributionOptions: SelectableOption[] = [
    {
      key: '0',
      value: t('grid'),
    },
    {
      key: '1',
      value: t('list'),
    },
  ]
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const {
    data: season,
    isLoading,
    error,
  } = useSWR<Season>(
    selectedSeasonId
      ? `${serverUrl}/details/season?id=${selectedSeasonId}`
      : null,
    authenticatedFetcher,
  )

  useEffect(() => {
    if ((isTablet || isMobile) && distribution !== 1) {
      prevDistribution.current = distribution
      setDistribution(1)
    } else if (
      !isTablet &&
      !isMobile &&
      distribution !== prevDistribution.current
    ) {
      setDistribution(prevDistribution.current)
    }
  }, [isMobile, isTablet, setDistribution, distribution])

  const getEpisodeMenu = (episode: Episode) => {
    return {
      items: [
        {
          items: [
            {
              title: 'Editar',
              action: () => {},
            },
            {
              title: 'Eliminar',
              action: () => {},
            },
            {
              title: t('markWatched'),
              action: () => {
                authenticatedFetch(`${serverUrl}/setEpisodeWatched`, 'POST', {
                  episodeId: episode.id,
                  watched: true,
                  userId: user?.id,
                }).finally(() => {
                  mutate((key: string) =>
                    key.startsWith(`${serverUrl}/details/series`),
                  )
                  mutate((key: string) =>
                    key.startsWith(`${serverUrl}/details/season`),
                  )
                })
              },
            },
            {
              title: t('markUnwatched'),
              action: () => {
                authenticatedFetch(`${serverUrl}/setEpisodeWatched`, 'POST', {
                  episodeId: episode.id,
                  watched: false,
                  userId: user?.id,
                }).finally(() => {
                  mutate((key: string) =>
                    key.startsWith(`${serverUrl}/details/series`),
                  )
                  mutate((key: string) =>
                    key.startsWith(`${serverUrl}/details/season`),
                  )
                })
              },
            },
          ],
        },
      ],
    }
  }

  const selectDistributionOption = (key: string, _value: string) => {
    prevDistribution.current = Number(key)
    setDistribution(Number(key))
  }

  const goToEpisodePage = (episode: Episode) => {
    navigate(`/details/episode/${episode.id}`)
  }

  const playEpisode = async (episodeId: Episode) => {
    const response = await authenticatedFetch(
      `${serverUrl}/details/episode-video?id=${episodeId.id}`,
    )

    if (!response.ok) {
      // Show error message
      return
    }

    const data = await response.json()
    navigate(`/video-player/${data.id}`)
  }

  // Loading Skeleton
  if (isLoading) {
    return (
      <FlexBox
        direction="column"
        gap={2}
        margin="1rem 0 0 0"
        padding={isMobile ? '1rem 2rem' : '0'}
        width={'100%'}
      >
        <FlexBox width={'100%'} justify="space-between" align="start">
          <FlexBox direction="column" gap={2}>
            {seasonList.length > 1 && <Skeleton />}

            <Skeleton />
          </FlexBox>

          {!isMobile && <Skeleton />}
        </FlexBox>
        {distribution === 0 ? (
          <Grid
            columns={
              isMobile
                ? 'repeat(auto-fill, minmax(200px, 1fr))'
                : 'repeat(auto-fill, minmax(400px, 1fr))'
            }
            gap="1rem"
            width="100%"
          >
            <Skeleton />
          </Grid>
        ) : (
          <FlexBox direction="column" gap={0.5}>
            <Skeleton />
          </FlexBox>
        )}
      </FlexBox>
    )
  }

  // No content
  if (!season || error) {
    return <NotFound />
  }

  // Episodes
  return (
    <FlexBox
      direction="column"
      gap={2}
      margin="1rem 0 0 0"
      padding={isMobile ? '1rem 2rem' : '0'}
      width={'100%'}
    >
      <FlexBox width={'100%'} justify="space-between" align="start">
        <span className="text-2xl font-semibold">{t('episodes')}</span>

        {!isMobile && !isTablet && (
          <SelectableWrapper
            key={'Distribution ' + distribution}
            defaultValue={distributionOptions[distribution].value}
            width="w-fit"
            options={distributionOptions}
            onValueChange={selectDistributionOption}
          />
        )}
      </FlexBox>
      {season.episodes && season.episodes.length > 0 && (
        <>
          {distribution === 0 ? (
            <FlexBox
              gap={1}
              wrap="wrap"
              justify="start"
              align="start"
              width="100%"
              height={'100%'}
            >
              {season.episodes
                .sort((a, b) => a.episodeNumber - b.episodeNumber)
                .map((episode) => (
                  <EpisodeCard
                    key={'Episode card' + episode.id}
                    episode={episode}
                    playEpisode={playEpisode}
                    goToDetails={goToEpisodePage}
                    getEpisodeMenu={getEpisodeMenu}
                  />
                ))}
            </FlexBox>
          ) : (
            <FlexBox direction="column" gap={0.5}>
              {season.episodes
                .sort((a, b) => a.episodeNumber - b.episodeNumber)
                .map((episode) => (
                  <EpisodeCardDetails
                    key={'Episode details' + episode.id}
                    episode={episode}
                    playEpisode={playEpisode}
                    goToDetails={goToEpisodePage}
                    getEpisodeMenu={getEpisodeMenu}
                  />
                ))}
            </FlexBox>
          )}
        </>
      )}
    </FlexBox>
  )
}

export default SeasonContent
