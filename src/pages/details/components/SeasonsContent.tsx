import Card from '@/components/cards/Card'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import useDataStore from '@/context/data.context'
import { Episode } from '@/data/interfaces/Media'
import { useNavigate } from '@tanstack/react-router'
import React from 'react'

function SeasonsContent() {
  const navigate = useNavigate()
  const {
    selectedLibrary,
    selectedSeries,
    selectedSeason,
    selectSeason,
    selectEpisode,
  } = useDataStore()
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

  return (
    <FlexBox direction="column" gap={2} margin="1rem 0 0 0" width={'100%'}>
      <FlexBox width={'100%'} justify="space-between" align="center">
        <SelectableWrapper
          defaultValue={selectedSeries.seasons[0].name}
          options={selectedSeries.seasons.map((season, index) => {
            return {
              key: String(index),
              value: season.name,
            }
          })}
          onValueChange={selectSeasonOption}
        />

        {selectedLibrary.type !== 'Music' && (
          <SelectableWrapper
            defaultValue={'Cuadrícula'}
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
      {distribution === 0 ? (
        <Grid columns="repeat(auto-fill, minmax(300px, 1fr))" width="100%">
          {selectedSeason
            ? selectedSeason.episodes.map((episode) => (
                <Card
                  itemKey={episode.id}
                  imgSrc={episode.imgSrc}
                  aspectRatio={16 / 9}
                  width={400}
                  title={episode.name}
                  subtitle={episode.episodeNumber.toString()}
                  action={function (): void {
                    throw new Error('Function not implemented.')
                  }}
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
                    title=""
                    subtitle=""
                    action={() => {
                      selectEpisode(episode)
                      navigate({ to: '/video-player' })
                    }}
                    hideButtons
                  />
                  <FlexBox direction="column">
                    <span>{episode.name}</span>
                    <span>{episode.episodeNumber}</span>
                    <span>{episode.overview}</span>
                  </FlexBox>
                </FlexBox>
              ))
            : null}
        </FlexBox>
      )}
    </FlexBox>
  )
}

export default SeasonsContent
