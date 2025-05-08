import FlexBox from '@/components/ui/FlexBox'
import useDataStore from '@/context/data.context'
import { Album, Song } from '@/data/interfaces/Music'
import React from 'react'
import { useTranslation } from 'react-i18next'
import MusicCard from './MusicCard'

interface SongsListProps {
  album: Album
}

function SongsList({ album }: SongsListProps) {
  const { t } = useTranslation()
  const { selectSong } = useDataStore()

  const hasDiscs = album.songs.some((song) => song.discNumber > 0)

  // Show all songs if there are no discs
  if (!hasDiscs) {
    return (
      <FlexBox direction="column" gap={1} width={'100%'}>
        <span className="text-xl font-semibold">{t('tracks')}</span>
        {album.songs.map((song, index) => (
          <MusicCard
            index={index}
            song={song}
            action={() => selectSong(song.id)}
          />
        ))}
      </FlexBox>
    )
  }

  const groupedByDisc = album.songs.reduce(
    (acc: { [key: number]: Song[] }, song) => {
      const discNumber = song.discNumber
      if (!acc[discNumber]) {
        acc[discNumber] = []
      }
      acc[discNumber].push(song)
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
          {songs.map((song, index) => (
            <MusicCard
              index={index}
              song={song}
              action={() => selectSong(song.id)}
            />
          ))}
        </FlexBox>
      ))}
    </>
  )
}

export default SongsList
