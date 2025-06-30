import FlexBox from '@/components/ui/FlexBox'
import { Album, Song } from '@/data/interfaces/Music'
import { useTranslation } from 'react-i18next'
import MusicCard from './MusicCard'
import useMusicStore from '@/context/music.context'

interface SongsListProps {
  album: Album
}

function SongsList({ album }: SongsListProps) {
  const { t } = useTranslation()
  const { currentSong, selectSong, setSongQueue, togglePlayPause, setIsShown } =
    useMusicStore((state) => ({
      currentSong: state.currentSong,
      selectSong: state.selectSong,
      setSongQueue: state.setSongQueue,
      togglePlayPause: state.togglePlayPause,
      setIsShown: state.setIsShown,
    }))

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
      ))}
    </>
  )
}

export default SongsList
