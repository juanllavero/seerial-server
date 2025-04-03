import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import useDataStore from '@/context/data.context'
import useMusicStore from '@/context/music.context'
import { Episode } from '@/data/interfaces/Media'
import { useNavigate } from '@tanstack/react-router'
import React from 'react'
import { useTranslation } from 'react-i18next'
import EpisodeCard from './cards/EpisodeCard'
import EpisodeCardDetails from './cards/EpisodeCardDetails'
import MusicCard from './music/MusicCard'
import SongsList from './music/SongsList'

function SeasonsContent() {
  const navigate = useNavigate()
  const {
    selectedLibrary,
    selectedSeries,
    selectedSeason,
    selectSeason,
    selectEpisode,
  } = useDataStore()
  const { t } = useTranslation()
  const {
    selectSong,
    setSongQueue,
    setMusicPlayerShown,
    setMusicPlayerContracted,
  } = useMusicStore()
  const [distribution, setDistribution] = React.useState(0)
  const isMobile = useIsMobile()

  if (!selectedLibrary || !selectedSeries) {
    return null
  }

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
    selectSeason(selectedSeries.seasons[Number(key)])
  }

  const selectDistributionOption = (key: string, _value: string) => {
    setDistribution(Number(key))
  }

  const goToDetails = (episode: Episode) => {
    if (!selectedSeason) return

    navigate({
      to: '/episodeDetails/$libraryId/$seriesId/$seasonId/$episodeId',
      params: {
        libraryId: selectedLibrary.id,
        seriesId: selectedSeries.id,
        seasonId: selectedSeason.id,
        episodeId: episode.id,
      },
    })
  }

  const playEpisode = (episode: Episode) => {
    if (!selectedSeason) return

    if (selectedLibrary.type === 'Music') {
      selectSong({
        library: selectedLibrary,
        collection: selectedSeries,
        album: selectedSeason,
        song: episode,
      })

      setSongQueue(
        selectedSeason.episodes.map((e) => ({
          library: selectedLibrary,
          collection: selectedSeries,
          album: selectedSeason,
          song: e,
        })),
      )

      setMusicPlayerShown(true)
      setMusicPlayerContracted(false)
    } else {
      selectEpisode(episode)
      navigate({
        to: '/video-player/$libraryId/$seriesId/$seasonId/$episodeId',
        params: {
          libraryId: selectedLibrary.id,
          seriesId: selectedSeries.id,
          seasonId: selectedSeason.id,
          episodeId: episode.id,
        },
      })
    }
  }

  const onlyMovie =
    selectedLibrary.type === 'Movies' &&
    selectedSeason &&
    selectedSeason.episodes &&
    selectedSeason.episodes.length <= 1

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
          {selectedSeries.seasons && selectedSeries.seasons.length > 1 && (
            <SelectableWrapper
              defaultValue={selectedSeries.seasons[0].name}
              options={selectedSeries.seasons.map((season, index) => {
                return {
                  key: String(index),
                  value: season.name,
                }
              })}
              width="fit-content"
              onValueChange={selectSeasonOption}
            />
          )}

          {!onlyMovie && selectedLibrary.type !== 'Music' && (
            <span>{t('episodes')}</span>
          )}
        </FlexBox>

        {selectedLibrary.type !== 'Music' && !onlyMovie && (
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
        )}
      </FlexBox>
      {selectedSeason &&
        selectedSeason.episodes &&
        selectedSeason.episodes.length > 1 && (
          <>
            {selectedLibrary.type === 'Music' ? (
              <SongsList handleSelectEpisode={playEpisode} />
            ) : distribution === 0 ? (
              <Grid
                columns={
                  isMobile
                    ? 'repeat(auto-fill, minmax(200px, 1fr))'
                    : 'repeat(auto-fill, minmax(400px, 1fr))'
                }
                gap="1rem"
                width="100%"
              >
                {selectedSeason
                  ? selectedSeason.episodes
                      .sort((a, b) => a.episodeNumber - b.episodeNumber)
                      .map((episode, index) => {
                        if (selectedLibrary.type === 'Music') {
                          return (
                            <MusicCard
                              index={index}
                              song={episode}
                              action={() => playEpisode(episode)}
                            />
                          )
                        } else {
                          return (
                            <EpisodeCard
                              episode={episode}
                              playEpisode={playEpisode}
                              goToDetails={goToDetails}
                              getEpisodeMenu={getEpisodeMenu}
                            />
                          )
                        }
                      })
                  : null}
              </Grid>
            ) : (
              <FlexBox direction="column" gap={0.5}>
                {selectedSeason
                  ? selectedSeason.episodes
                      .sort((a, b) => a.episodeNumber - b.episodeNumber)
                      .map((episode) => (
                        <EpisodeCardDetails
                          episode={episode}
                          playEpisode={playEpisode}
                          goToDetails={goToDetails}
                        />
                      ))
                  : null}
              </FlexBox>
            )}
          </>
        )}
    </FlexBox>
  )
}

export default SeasonsContent
