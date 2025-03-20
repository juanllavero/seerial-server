import Card from '@/components/cards/Card'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import useDataStore from '@/context/data.context'
import useMusicStore from '@/context/music.context'
import { Episode } from '@/data/interfaces/Media'
import { useNavigate } from '@tanstack/react-router'
import React from 'react'
import { useTranslation } from 'react-i18next'

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
  const [distribution, setDistribution] = React.useState(1)

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

  const handleSelectEpisode = (episode: Episode) => {
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
    <FlexBox direction="column" gap={2} margin="1rem 0 0 0" width={'100%'}>
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

          {!onlyMovie && <span>{t('episodes')}</span>}
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
            {distribution === 0 ? (
              <Grid
                columns="repeat(auto-fill, minmax(400px, 1fr))"
                gap="1rem"
                width="100%"
              >
                {selectedSeason
                  ? selectedSeason.episodes.map((episode) => (
                      <Card
                        itemKey={episode.id}
                        imgSrc={episode.imgSrc}
                        aspectRatio={16 / 9}
                        width={400}
                        progress={
                          (episode.timeWatched / episode.runtimeInSeconds) *
                            100 >
                          0
                            ? (episode.timeWatched / episode.runtimeInSeconds) *
                              100
                            : undefined
                        }
                        title={episode.name}
                        subtitle={`${t('episode')} ${episode.episodeNumber.toString()}`}
                        action={() => handleSelectEpisode(episode)}
                        menu={getEpisodeMenu(episode)}
                      />
                    ))
                  : null}
              </Grid>
            ) : (
              <FlexBox direction="column" gap={0.5}>
                {selectedSeason
                  ? selectedSeason.episodes.map((episode) => (
                      <FlexBox justify="space-between" align="center" gap={2}>
                        <Card
                          itemKey={episode.id}
                          imgSrc={episode.imgSrc}
                          aspectRatio={16 / 9}
                          width={400}
                          progress={
                            (episode.timeWatched / episode.runtimeInSeconds) *
                              100 >
                            0
                              ? (episode.timeWatched /
                                  episode.runtimeInSeconds) *
                                100
                              : undefined
                          }
                          title=""
                          subtitle=""
                          action={() => handleSelectEpisode(episode)}
                          hideButtons
                        />
                        <FlexBox direction="column">
                          <span>{episode.name}</span>
                          <span className="mb-3">{`${t('episode')} ${episode.episodeNumber.toString()}`}</span>
                          <span>{episode.overview}</span>
                        </FlexBox>
                      </FlexBox>
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
