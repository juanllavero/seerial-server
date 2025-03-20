import { Song } from '@/data/interfaces/Media'
import { create } from 'zustand'

interface MusicState {
  currentSong: Song | null
  songQueue: Song[]
  isPlaying: boolean
  musicPlayerShown: boolean
  musicPlayerContracted: boolean

  // Set Current Song
  selectSong: (song: Song | null) => void

  // Queue
  addSong: (song: Song) => void
  removeSong: (song: Song) => void
  clearQueue: () => void

  // Player
  setIsPlaying: (isPlaying: boolean) => void
  setMusicPlayerShown: (musicPlayerShown: boolean) => void
  setMusicPlayerContracted: (musicPlayerContracted: boolean) => void

  // Utils
  setSongQueue: (queue: Song[]) => void
}

const useMusicStore = create<MusicState>((set) => ({
  currentSong: null,
  songQueue: [],
  isPlaying: false,
  musicPlayerShown: false,
  musicPlayerContracted: false,

  // Set Current Song
  selectSong: (song) => set({ currentSong: song }),

  // Queue
  addSong: (song) =>
    set((state) => ({ songQueue: [...state.songQueue, song] })),
  removeSong: (element) =>
    set((state) => ({
      songQueue: state.songQueue.filter((s) => s.song.id !== element.song.id),
    })),
  clearQueue: () => set({ songQueue: [] }),

  // Player
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setMusicPlayerShown: (musicPlayerShown) => set({ musicPlayerShown }),
  setMusicPlayerContracted: (musicPlayerContracted) =>
    set({ musicPlayerContracted }),

  // Utils
  setSongQueue: (queue) => set({ songQueue: queue }),
}))

export default useMusicStore
