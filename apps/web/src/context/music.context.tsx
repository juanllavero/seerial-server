import { createWithEqualityFn } from 'zustand/traditional'
import { RepeateMode } from '@/data/enums/Music'
import type { Album, Song } from '@/data/interfaces/Music'

interface MusicState {
  currentSong: Song | null
  album: Album | null
  songQueue: Song[]
  showLyrics: boolean
  showQueue: boolean
  isPlaying: boolean
  isShuffling: boolean
  repeateMode: RepeateMode
  prevVolume: number
  volume: number
  isMute: boolean
  progress: number
  buffered: number
  currentTime: number
  duration: number
  isShown: boolean
  isExpanded: boolean
  isLoading: boolean
  audioRef: React.RefObject<HTMLAudioElement | null> | null

  // Set Current Song
  selectSong: (song: Song | null) => void
  setAlbum: (album: Album | null) => void
  resetPlayerState: () => void

  // Queue
  addSong: (song: Song) => void
  removeSong: (song: Song) => void
  clearQueue: () => void

  // Player Controls
  seekTo: (time: number) => void
  setShowLyrics: (showLyrics: boolean) => void
  setShowQueue: (showQueue: boolean) => void
  setIsPlaying: (isPlaying: boolean) => void
  setIsShuffling: (isShuffling: boolean) => void
  setRepeateMode: (repeateMode: RepeateMode) => void
  setPrevVolume: (volume: number) => void
  setVolume: (volume: number) => void
  setIsMute: (isMute: boolean) => void
  setProgress: (progress: number) => void
  setBuffered: (buffered: number) => void
  setCurrentTime: (currentTime: number) => void
  setDuration: (duration: number) => void
  setIsLoading: (isLoading: boolean) => void

  // Utils
  setSongQueue: (queue: Song[]) => void
  setIsShown: (musicPlayerShown: boolean) => void
  setIsExpanded: (musicPlayerContracted: boolean) => void

  // Audio Controls
  togglePlayPause: () => void
  handleChangeRepeatState: (e: React.MouseEvent) => void
  handlePrevious: () => void
  handleNext: () => void
  handleSongSelect: (index: number) => void
  initializeAudioRef: (ref: React.RefObject<HTMLAudioElement | null>) => void
  getAudioSrc: () => string
}

const useMusicStore = createWithEqualityFn<MusicState>((set, get) => ({
  currentSong: null,
  album: null,
  songQueue: [],
  showLyrics: false,
  showQueue: false,
  isPlaying: false,
  isShuffling: false,
  repeateMode: RepeateMode.NONE,
  prevVolume: 75,
  volume: 75,
  isMute: false,
  progress: 0,
  buffered: 0,
  currentTime: 0,
  duration: 0,
  isShown: false,
  isExpanded: false,
  isLoading: false,
  audioRef: null,

  // Set Current Song
  selectSong: (song) =>
    set({
      currentSong: song,
      progress: 0,
      duration: song?.duration ?? 0,
      currentTime: 0,
      isShown: true,
      isLoading: !!song,
    }),
  setAlbum: (album) => set({ album, songQueue: album?.songs ?? [] }),
  resetPlayerState: () => {
    const { audioRef } = get()
    if (audioRef?.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    set({
      currentSong: null,
      isPlaying: false,
      isExpanded: false,
      progress: 0,
      currentTime: 0,
      duration: 0,
      buffered: 0,
      isShown: false,
      isLoading: false,
      audioRef: null,
    })
  },

  // Queue
  addSong: (song) => set((state) => ({ songQueue: [...state.songQueue, song] })),
  removeSong: (element) =>
    set((state) => ({
      songQueue: state.songQueue.filter((s) => s.id !== element.id),
    })),
  clearQueue: () => set({ songQueue: [] }),

  // Player Controls
  seekTo: (time) => {
    const { audioRef, duration, setCurrentTime, setProgress } = get()
    if (audioRef?.current && duration > 0) {
      const newTime = Math.max(0, Math.min(time, duration))

      audioRef.current.currentTime = newTime

      setCurrentTime(newTime)
      setProgress((newTime / duration) * 100)
    }
  },
  setShowLyrics: (showLyrics) => set({ showLyrics }),
  setShowQueue: (showQueue) => set({ showQueue }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsShuffling: (isShuffling) => set({ isShuffling }),
  setRepeateMode: (repeateMode) => set({ repeateMode }),
  setPrevVolume: (volume) => set({ prevVolume: volume }),
  setVolume: (volume) => {
    const clampedVolume = Math.max(0, Math.min(100, volume))
    set((state) => ({
      volume: clampedVolume,
      isMute: state.isMute && clampedVolume > 0 ? false : state.isMute,
    }))
    const { audioRef, isMute } = get()
    if (audioRef?.current) {
      audioRef.current.volume = isMute ? 0 : clampedVolume / 100
    }
  },
  setIsMute: (isMute) => {
    set((state) => ({
      isMute,
      prevVolume: isMute ? state.volume : state.prevVolume,
      volume: isMute ? state.volume : state.prevVolume,
    }))
    const { audioRef, volume } = get()
    if (audioRef?.current) {
      audioRef.current.volume = isMute ? 0 : volume / 100
    }
  },
  setProgress: (progress) => set({ progress }),
  setBuffered: (buffered) => set({ buffered }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setIsLoading: (isLoading) => set({ isLoading }),

  // Utils
  setSongQueue: (queue) => set({ songQueue: queue }),
  setIsShown: (musicPlayerShown) => set({ isShown: musicPlayerShown }),
  setIsExpanded: (musicPlayerContracted) => set({ isExpanded: musicPlayerContracted }),

  // Audio Controls
  togglePlayPause: () => {
    const { audioRef, isPlaying } = get()
    const audio = audioRef?.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch((e) => console.error('Playback error:', e))
    }
  },

  handleChangeRepeatState: (e: React.MouseEvent) => {
    e.stopPropagation()
    const { repeateMode, setRepeateMode } = get()
    setRepeateMode(
      repeateMode === RepeateMode.NONE
        ? RepeateMode.REPEAT_ALL
        : repeateMode === RepeateMode.REPEAT_ALL
          ? RepeateMode.REPEAT_ONE
          : RepeateMode.NONE,
    )
  },

  handlePrevious: () => {
    const { currentSong, currentTime, songQueue, repeateMode, selectSong, seekTo } = get()

    if (currentTime >= 3) {
      seekTo(0)
      return
    }

    const currentIndex = songQueue.findIndex((song) => song.id === currentSong?.id)
    if (currentIndex > 0) {
      selectSong(songQueue[currentIndex - 1])
    } else if (repeateMode === RepeateMode.REPEAT_ALL) {
      selectSong(songQueue[songQueue.length - 1])
    }

    seekTo(0)
  },

  handleNext: () => {
    const { currentSong, songQueue, repeateMode, selectSong } = get()
    const currentIndex = songQueue.findIndex((song) => song.id === currentSong?.id)
    if (currentIndex < songQueue.length - 1) {
      selectSong(songQueue[currentIndex + 1])
    } else if (repeateMode === RepeateMode.REPEAT_ALL) {
      selectSong(songQueue[0])
    } else {
      get().resetPlayerState()
    }
  },

  handleSongSelect: (index: number) => {
    const { songQueue, selectSong } = get()
    selectSong(songQueue[index])
  },

  initializeAudioRef: (ref: React.RefObject<HTMLAudioElement | null>) => {
    set({ audioRef: ref })

    const audio = ref.current
    if (!audio) return

    // Sync functions
    const syncIsPlaying = () => get().setIsPlaying(true)
    const syncIsPaused = () => get().setIsPlaying(false)
    const syncIsLoading = () => get().setIsLoading(true)
    const syncIsNotLoading = () => get().setIsLoading(false)

    // Update progress and buffer
    const updateBuffer = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1)
        const total = audio.duration || 0
        if (total > 0) {
          get().setBuffered((bufferedEnd / total) * 100)
        }
      }
    }

    const handleLoadedMetadata = () => {
      get().setDuration(audio.duration)
    }

    const handleCanPlay = () => {
      updateBuffer()
      syncIsNotLoading()
    }

    const handleWaiting = () => {
      syncIsLoading()
    }

    const updateProgress = () => {
      const { duration } = get()
      const progressPercent = (audio.currentTime / audio.duration) * 100
      get().setProgress(progressPercent)
      get().setCurrentTime((progressPercent / 100) * duration)
    }

    // Handle song end
    const handleEnded = () => {
      const { repeateMode, songQueue, handleNext, selectSong } = get()
      if (repeateMode === RepeateMode.REPEAT_ONE) {
        audio.currentTime = 0
        audio.play()
      } else if (repeateMode === RepeateMode.REPEAT_ALL && songQueue.length > 1) {
        handleNext()
      } else {
        get().resetPlayerState()
      }
    }

    // Update volume
    const updateVolume = () => {
      const { volume, isMute } = get()
      audio.volume = isMute ? 0 : volume / 100
    }

    // Spacebar control
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        get().togglePlayPause()
      }
    }

    // Add event listeners
    audio.addEventListener('play', syncIsPlaying)
    audio.addEventListener('playing', syncIsPlaying)
    audio.addEventListener('pause', syncIsPaused)
    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('progress', updateBuffer)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('ended', handleEnded)
    document.addEventListener('keydown', handleKeyPress)

    // Initial sync
    if (audio.paused) {
      syncIsPaused()
    } else {
      syncIsPlaying()
    }

    updateVolume()

    // Cleanup
    return () => {
      audio.removeEventListener('play', syncIsPlaying)
      audio.removeEventListener('playing', syncIsPlaying)
      audio.removeEventListener('pause', syncIsPaused)
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('progress', updateBuffer)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('ended', handleEnded)
      document.removeEventListener('keydown', handleKeyPress)
    }
  },

  getAudioSrc: () => {
    const { currentSong } = get()
    // Note: selectedServer is not available in the store, so this assumes it's passed or handled elsewhere
    return currentSong ? `/audio-stream?path=${currentSong.fileSrc}&isWeb=true` : ''
  },
}))

export default useMusicStore
