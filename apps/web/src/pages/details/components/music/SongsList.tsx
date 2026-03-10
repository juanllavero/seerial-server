import { useTranslation } from 'react-i18next'
import { shallow } from 'zustand/shallow'
import FlexBox from '@/components/ui/FlexBox'
import useMusicStore from '@/context/music.context'
import type { Album, Song } from '@/data/interfaces/Music'
import MusicCard from './MusicCard'

interface SongsListProps {
  album: Album
}

function SongsList({ album }: SongsListProps) {
  const { t } = useTranslation()
  const { currentSong, selectSong, setSongQueue, togglePlayPause, setIsShown } = useMusicStore(
    (state) => ({
      currentSong: state.currentSong,
      selectSong: state.selectSong,
      setSongQueue: state.setSongQueue,
      togglePlayPause: state.togglePlayPause,
      setIsShown: state.setIsShown,
    }),
    shallow,
  )

  const hasDiscs = album.songs.some((song) => song.discNumber > 0)

  // Show all songs if there are no discs
  if (!hasDiscs) {
    return (
      <FlexBox direction="column" gap={1} width={'100%'}>
        <span className="pl-1 text-xl font-semibold">{t('tracks')}</span>
        {album.songs.map((song, index) => (
          <MusicCard
            index={index}
            song={song}
            handlePlaySong={() => {
              if (currentSong === song) {
                togglePlayPause()
              } else {
                selectSong(song)
                setIsShown(true)
                setSongQueue(album.songs)
              }
            }}
          />
        ))}
      </FlexBox>
    )
  }

  const groupedByDisc = album.songs.reduce((acc: { [key: number]: Song[] }, song) => {
    const discNumber = song.discNumber || 0 // Ensure discNumber is 0 if null/undefined
    if (!acc[discNumber]) {
      acc[discNumber] = []
    }
    acc[discNumber].push(song)
    return acc
  }, {})

  // Convert the grouped object into an array sorted by disc number, with disc 0 at the end
  const discEntries = Object.entries(groupedByDisc).sort(([discA], [discB]) => {
    const numA = Number(discA)
    const numB = Number(discB)
    if (numA === 0) return 1 // Move disc 0 to the end
    if (numB === 0) return -1 // Keep other discs before disc 0
    return numA - numB // Sort other discs numerically
  })

  // Create a flat list for playback (it will respect the new order)
  const flatList = discEntries.flatMap(([, songs]) => songs)

  return (
    <>
      {discEntries.map(([discNumber, songs]) => (
        <FlexBox key={discNumber} direction="column" gap={1} width={'100%'}>
          <span className="text-xl font-semibold">
            {/* Change title for disc 0 to 'extras' */}
            {Number(discNumber) === 0 ? t('extras') : `${t('disc')} ${discNumber}`}
          </span>
          {songs.map((song, index) => (
            <MusicCard
              key={song.id}
              index={index}
              song={song}
              handlePlaySong={() => {
                if (currentSong === song) {
                  togglePlayPause()
                } else {
                  selectSong(song)
                  setIsShown(true)
                  setSongQueue(flatList) // Use the correctly ordered flatList
                }
              }}
            />
          ))}
        </FlexBox>
      ))}
    </>
  )
}

export default SongsList
