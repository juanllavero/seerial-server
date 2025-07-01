import GradientBackground from '@/layouts/backgrounds/GradientBackground'
import { memo } from 'react'
import useMusicStore from '@/context/music.context'
import MusicPlayerCover from './cover/Cover'
import MusicPlayerHeader from './header/Header'
import NextSongs from '../menu/NextSongs'
import LRCVisualizer from '../lyrics/LRCVisualizer'
import { shallow } from 'zustand/shallow'

function DesktopMusicPlayerExpanded() {
  const { album, isExpanded, currentSong, showLyrics, showQueue } =
    useMusicStore(
      (state) => ({
        album: state.album,
        isExpanded: state.isExpanded,
        currentSong: state.currentSong,
        showLyrics: state.showLyrics,
        showQueue: state.showQueue,
      }),
      shallow,
    )

  if (!album || !currentSong) return null

  return (
    <div
      className={`fixed bottom-0 z-199 flex w-screen flex-col transition-all duration-200 ease-in-out ${
        isExpanded ? 'h-full bg-neutral-800' : 'h-0 translate-y-50 bg-black'
      }`}
    >
      <div className="fixed h-screen w-screen">
        <GradientBackground showGradient={isExpanded} isSong />
      </div>

      <MusicPlayerHeader />

      <div
        className={`flex max-h-full min-h-0 flex-1 justify-between gap-10 p-10 pt-0 pb-0 transition-all duration-100 ease-in-out ${showQueue ? '' : 'pr-0'}`}
      >
        <div className="relative flex-1 overflow-hidden">
          <div
            className={`flex h-full w-full transition-transform duration-500 ease-in-out ${
              showLyrics ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            {/* Music Cover */}
            <div
              className={`flex h-full min-w-full flex-shrink-1 items-center justify-center ${isExpanded || showLyrics ? 'translate-x-0' : 'translate-x-full'}`}
            >
              <MusicPlayerCover />
            </div>

            {/* Sync Lyrics */}
            <div
              className={`flex h-full min-w-full flex-shrink-0 items-center justify-center ${isExpanded || !showLyrics ? 'translate-x-0' : 'translate-x-full'}`}
            >
              <LRCVisualizer />
            </div>
          </div>
        </div>

        <div
          className={`pt-20 pb-10 transition-all delay-0 duration-400 ease-in-out ${
            isExpanded
              ? showQueue
                ? 'w-100 max-w-100 min-w-100 flex-1 translate-x-0 opacity-100'
                : 'pointer-events-none w-0 max-w-0 min-w-0 translate-x-20 opacity-100 transition-all'
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
