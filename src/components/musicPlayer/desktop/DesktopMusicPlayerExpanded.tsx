import GradientBackground from '@/layouts/backgrounds/GradientBackground'
import { memo } from 'react'
import useMusicStore from '@/context/music.context'
import MusicPlayerCover from '../cover/Cover'
import MusicPlayerHeader from '../header/Header'
import NextSongs from '../menu/NextSongs'
import Lyrics from '../menu/Lyrics'

function DesktopMusicPlayerExpanded() {
  const { album, isExpanded, currentSong, showLyrics, showQueue } =
    useMusicStore()
  if (!album || !currentSong) return null

  return (
    <div
      className={`absolute bottom-0 z-199 transition-all duration-200 ease-in-out ${
        isExpanded
          ? 'flex h-full cursor-default flex-col bg-gray-700'
          : 'flex h-0 w-screen translate-y-50 flex-row bg-black'
      }`}
    >
      <GradientBackground showGradient={true} isSong />

      <MusicPlayerHeader />

      <div
        className={`transition-all duration-500 ease-in-out ${isExpanded ? `flex max-h-full min-h-0 flex-1 justify-between gap-10 p-10 pt-0 pb-0 ${showQueue ? '' : 'pr-0'}` : 'p-4'}`}
      >
        {!showLyrics || !isExpanded ? <MusicPlayerCover /> : <Lyrics />}

        <div
          className={`pt-20 pb-10 transition-all delay-0 duration-600 ease-in-out ${
            isExpanded
              ? showQueue
                ? 'w-100 min-w-100 flex-1 translate-x-0 opacity-100'
                : 'pointer-events-none w-0 min-w-0 translate-x-20 opacity-100 transition-all'
              : 'pointer-events-none absolute translate-x-8 opacity-0 transition-none'
          }`}
        >
          <NextSongs />
        </div>
      </div>

      <div className="h-40 w-screen"></div>
    </div>
  )
}

export default memo(DesktopMusicPlayerExpanded)
