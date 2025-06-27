import { create } from 'zustand'
import { RepeateMode } from '@/data/enums/Music'
import { Album, Song } from '@/data/interfaces/Music'

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
  audioRef: React.RefObject<HTMLAudioElement | null> | null

  // Set Current Song
  selectSong: (song: Song | null) => void
  setAlbum: (album: Album | null) => void

  // Queue
  addSong: (song: Song) => void
  removeSong: (song: Song) => void
  clearQueue: () => void

  // Player Controls
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

const useMusicStore = create<MusicState>((set, get) => ({
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
  audioRef: null,

  // Set Current Song
  selectSong: (song) =>
    set({
      currentSong: song,
      progress: 0,
      duration: song?.duration ?? 0,
      currentTime: 0,
      isShown: true,
    }),
  setAlbum: (album) => set({ album, songQueue: album?.songs ?? [] }),

  // Queue
  addSong: (song) =>
    set((state) => ({ songQueue: [...state.songQueue, song] })),
  removeSong: (element) =>
    set((state) => ({
      songQueue: state.songQueue.filter((s) => s.id !== element.id),
    })),
  clearQueue: () => set({ songQueue: [] }),

  // Player Controls
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

  // Utils
  setSongQueue: (queue) => set({ songQueue: queue }),
  setIsShown: (musicPlayerShown) => set({ isShown: musicPlayerShown }),
  setIsExpanded: (musicPlayerContracted) =>
    set({ isExpanded: musicPlayerContracted }),

  // Audio Controls
  togglePlayPause: () => {
    const { audioRef, isPlaying, setIsPlaying } = get()
    const audio = audioRef?.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch((e) => console.error('Playback error:', e))
    }
    setIsPlaying(!isPlaying)
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
    const { currentSong, songQueue, repeateMode, selectSong, setIsPlaying } =
      get()
    const currentIndex = songQueue.findIndex(
      (song) => song.id === currentSong?.id,
    )
    if (currentIndex > 0) {
      selectSong(songQueue[currentIndex - 1])
    } else if (repeateMode === RepeateMode.REPEAT_ALL) {
      selectSong(songQueue[songQueue.length - 1])
    }
    setIsPlaying(true)
  },

  handleNext: () => {
    const { currentSong, songQueue, repeateMode, selectSong, setIsPlaying } =
      get()
    const currentIndex = songQueue.findIndex(
      (song) => song.id === currentSong?.id,
    )
    if (currentIndex < songQueue.length - 1) {
      selectSong(songQueue[currentIndex + 1])
    } else if (repeateMode === RepeateMode.REPEAT_ALL) {
      selectSong(songQueue[0])
    } else {
      setIsPlaying(false)
      selectSong(null)
    }
    setIsPlaying(true)
  },

  handleSongSelect: (index: number) => {
    const { songQueue, selectSong, setIsPlaying } = get()
    selectSong(songQueue[index])
    setIsPlaying(true)
  },

  initializeAudioRef: (ref: React.RefObject<HTMLAudioElement | null>) => {
    set({ audioRef: ref })

    const audio = ref.current
    if (!audio) return

    // Sync audio element with isPlaying state
    const syncPlayback = () => {
      const { isPlaying } = get()
      if (isPlaying) {
        audio.play().catch((e) => console.error('Playback error:', e))
      } else {
        audio.pause()
      }
    }

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
    }

    const updateProgress = () => {
      const { duration } = get()
      const progressPercent = (audio.currentTime / audio.duration) * 100
      get().setProgress(progressPercent)
      get().setCurrentTime((progressPercent / 100) * duration)
    }

    // Handle song end
    const handleEnded = () => {
      const { repeateMode, songQueue, handleNext, setIsPlaying, selectSong } =
        get()
      if (repeateMode === RepeateMode.REPEAT_ONE) {
        audio.currentTime = 0
        audio.play()
      } else if (
        repeateMode === RepeateMode.REPEAT_ALL &&
        songQueue.length > 1
      ) {
        handleNext()
      } else {
        setIsPlaying(false)
        selectSong(null)
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
    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('progress', updateBuffer)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('ended', handleEnded)
    document.addEventListener('keydown', handleKeyPress)
    syncPlayback()
    updateVolume()

    // Cleanup
    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('progress', updateBuffer)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('ended', handleEnded)
      document.removeEventListener('keydown', handleKeyPress)
    }
  },

  getAudioSrc: () => {
    const { currentSong } = get()
    // Note: selectedServer is not available in the store, so this assumes it's passed or handled elsewhere
    return currentSong ? `/audio?path=${currentSong.fileSrc}` : ''
  },
}))

export default useMusicStore
