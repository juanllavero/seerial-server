import { RepeateMode } from '@/data/enums/Music'
import { Song } from '@/data/interfaces/Music'
import { create } from 'zustand'

interface MusicState {
  currentSong: Song | null
  songQueue: Song[]

  isPlaying: boolean
  isShuffling: boolean
  repeateMode: RepeateMode
  prevVolume: number
  volume: number
  isMute: boolean
  progress: number
  currentTime: number

  isShown: boolean
  isExpanded: boolean

  // Set Current Song
  selectSong: (song: Song | null) => void

  // Queue
  addSong: (song: Song) => void
  removeSong: (song: Song) => void
  clearQueue: () => void

  // Player Controls
  setIsPlaying: (isPlaying: boolean) => void
  setIsShuffling: (isShuffling: boolean) => void
  setRepeateMode: (repeateMode: RepeateMode) => void
  setPrevVolume: (volume: number) => void
  setVolume: (volume: number) => void
  setIsMute: (isMute: boolean) => void
  setProgress: (progress: number) => void
  setCurrentTime: (currentTime: number) => void

  // Utils
  setSongQueue: (queue: Song[]) => void
  setIsShown: (musicPlayerShown: boolean) => void
  setIsExpanded: (musicPlayerContracted: boolean) => void
}

const useMusicStore = create<MusicState>((set) => ({
  currentSong: null,
  songQueue: [],
  isPlaying: false,
  isShuffling: false,
  repeateMode: RepeateMode.NONE,
  prevVolume: 75,
  volume: 75,
  isMute: false,
  progress: 0,
  currentTime: 0,

  isShown: false,
  isExpanded: false,

  // Set Current Song
  selectSong: (song) =>
    set({ currentSong: song, progress: 0, currentTime: 0, isShown: true }),

  // Queue
  addSong: (song) =>
    set((state) => ({ songQueue: [...state.songQueue, song] })),
  removeSong: (element) =>
    set((state) => ({
      songQueue: state.songQueue.filter((s) => s.id !== element.id),
    })),
  clearQueue: () => set({ songQueue: [] }),

  // Player
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsShuffling: (isShuffling) => set({ isShuffling }),
  setRepeateMode: (repeateMode) => set({ repeateMode }),
  setPrevVolume: (volume) => set({ prevVolume: volume }),
  setVolume: (volume) => set({ volume: volume }),
  setIsMute: (isMute) => set({ isMute }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (currentTime) => set({ currentTime }),

  // Utils
  setSongQueue: (queue) => set({ songQueue: queue }),
  setIsShown: (musicPlayerShown) => set({ isShown: musicPlayerShown }),
  setIsExpanded: (musicPlayerContracted) =>
    set({ isExpanded: musicPlayerContracted }),
}))

export default useMusicStore
