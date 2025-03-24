import FlexBox from '@/components/ui/FlexBox'
import useDataStore from '@/context/data.context'
import { Episode } from '@/data/interfaces/Media'
import React from 'react'
import { useTranslation } from 'react-i18next'
import MusicCard from './MusicCard'

interface SongsListProps {
  handleSelectEpisode: (episode: any) => void
}

function SongsList({ handleSelectEpisode }: SongsListProps) {
  const { t } = useTranslation()
  const { selectedLibrary, selectedSeries, selectedSeason } = useDataStore()

  if (!selectedLibrary || !selectedSeries || !selectedSeason) return null

  const hasDiscs = selectedSeason.episodes.some(
    (episode) => episode.seasonNumber > 0,
  )

  // Show all songs if there are no discs
  if (!hasDiscs) {
    return (
      <FlexBox direction="column" gap={1} width={'100%'}>
        <span className="text-xl font-semibold">{t('tracks')}</span>
        {selectedSeason.episodes.map((episode, index) => (
          <MusicCard
            index={index}
            library={selectedLibrary}
            collection={selectedSeries}
            album={selectedSeason}
            song={episode}
            action={() => handleSelectEpisode(episode)}
            menu={{}}
          />
        ))}
      </FlexBox>
    )
  }

  const groupedByDisc = selectedSeason.episodes.reduce(
    (acc: { [key: number]: Episode[] }, episode) => {
      const discNumber = episode.seasonNumber
      if (!acc[discNumber]) {
        acc[discNumber] = []
      }
      acc[discNumber].push(episode)
      return acc
    },
    {},
  )

  // Convert the grouped object into an array sorted by disc number
  const discEntries = Object.entries(groupedByDisc).sort(
    ([discA], [discB]) => Number(discA) - Number(discB),
  )

  // Create a flat list for playback
  const flatList = discEntries.flatMap(([, songs]) => songs)

  return (
    <>
      {discEntries.map(([discNumber, songs]) => (
        <FlexBox direction="column" gap={1} width={'100%'}>
          <span className="text-xl font-semibold">
            {t('disc')} {discNumber}
          </span>
          {songs.map((episode, index) => (
            <MusicCard
              index={index}
              library={selectedLibrary}
              collection={selectedSeries}
              album={selectedSeason}
              song={episode}
              action={() => handleSelectEpisode(episode)}
              menu={{}}
            />
          ))}
        </FlexBox>
      ))}
    </>
  )
}

export default SongsList
