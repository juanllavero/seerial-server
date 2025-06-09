import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import { useAuth } from '@/context/auth.context'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Episode, Season } from '@/data/interfaces/Media'
import { useNavigate, useParams } from 'react-router-dom'
import React, { use, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import EpisodeCard from './cards/EpisodeCard'
import EpisodeCardDetails from './cards/EpisodeCardDetails'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import NotFound from '@/components/NotFound'
import { Skeleton } from '@/components/ui/skeleton'
import { useCardWidth } from '@/hooks/useCardWidth'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { SelectableOption } from '@/data/interfaces/Utils'

interface SeasonContentProps {
  seasonList: Season[]
  serverId: string
  serverIP: string
}

function SeasonContent({ seasonList, serverId, serverIP }: SeasonContentProps) {
  const navigate = useNavigate()
  const { selectSeason } = useDataStore()
  const { t } = useTranslation()
  const { cardWidth } = useCardWidth()
  const { selectedSeasonId } = useDataStore()
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
      ? `https://${serverIP}/details/season?id=${selectedSeasonId}`
      : null,
    fetcher,
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
          ],
        },
      ],
    }
  }

  const selectSeasonOption = (key: string, _value: string) => {
    selectSeason(seasonList[Number(key)]?.id || null)
  }

  const selectDistributionOption = (key: string, _value: string) => {
    prevDistribution.current = Number(key)
    setDistribution(Number(key))
  }

  const goToEpisodePage = (episode: Episode) => {
    navigate(`/server/${serverId}/details/episode/${episode.id}`)
  }

  const playEpisode = async (episodeId: Episode) => {
    const response = await fetch(
      `https://${serverIP}/episode-video?episodeId=${episodeId.id}`,
    )

    if (!response.ok) {
      // Show error message
      return
    }

    const data = await response.json()
    navigate(`/server/${serverId}/video-player/${data.id}`)
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
        <FlexBox direction="column" gap={2}>
          {seasonList.length > 1 && (
            <SelectableWrapper
              defaultValue={season ? season.name : seasonList[0].name}
              options={seasonList.map((season, index) => {
                return {
                  key: String(index),
                  value: season.name,
                }
              })}
              width="fit-content"
              onValueChange={selectSeasonOption}
            />
          )}

          <span>{t('episodes')}</span>
        </FlexBox>

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
