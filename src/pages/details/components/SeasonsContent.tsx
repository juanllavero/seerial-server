import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Episode, Season } from '@/data/interfaces/Media'
import { useNavigate } from '@tanstack/react-router'
import React from 'react'
import { useTranslation } from 'react-i18next'
import EpisodeCard from './cards/EpisodeCard'
import EpisodeCardDetails from './cards/EpisodeCardDetails'

interface SeasonContentProps {
  seasonList: Season[]
  season: Season
}

function SeasonContent({ seasonList, season }: SeasonContentProps) {
  const navigate = useNavigate()
  const { selectSeason } = useDataStore()
  const { t } = useTranslation()
  const { serverIP } = useServerStore()
  const [distribution, setDistribution] = React.useState(0)
  const isMobile = useIsMobile()

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
    setDistribution(Number(key))
  }

  const goToEpisodePage = (episode: Episode) => {
    navigate({
      to: '/details/episode/$episodeId',
      params: {
        episodeId: episode.id,
      },
    })
  }

  const playEpisode = async (episodeId: Episode) => {
    const response = await fetch(
      `http://${serverIP}/episode-video?episodeId=${episodeId.id}`,
    )

    if (!response.ok) {
      // Show error message
      return
    }

    const data = await response.json()
    navigate({
      to: '/video-player/$videoId',
      params: {
        videoId: data.videoId,
      },
    })
  }

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
              defaultValue={seasonList[0].name}
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

        <SelectableWrapper
          defaultValue={'Cuadrícula'}
          width="w-fit"
          options={[
            {
              key: '0',
              value: 'Cuadrícula',
            },
            {
              key: '1',
              value: 'Detalles',
            },
          ]}
          onValueChange={selectDistributionOption}
        />
      </FlexBox>
      {season.episodes && season.episodes.length > 1 && (
        <>
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
            </Grid>
          ) : (
            <FlexBox direction="column" gap={0.5}>
              {season.episodes
                .sort((a, b) => a.episodeNumber - b.episodeNumber)
                .map((episode) => (
                  <EpisodeCardDetails
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
