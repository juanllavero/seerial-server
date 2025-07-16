import { createWithEqualityFn } from 'zustand/traditional'
import { OnLoadData, OnProgressData } from 'react-native-video'
import { VideoRef } from 'react-native-video' // Tipo para la referencia
import { Album, Song } from '@/data/interfaces/Music'

// Puedes mantener tu propio enum o usar el que prefieras
export enum RepeateMode {
	NONE,
	REPEAT_ALL,
	REPEAT_ONE,
}

interface MusicState {
	playerRef: React.RefObject<VideoRef | null> | null
	currentSong: Song | null
	album: Album | null
	songQueue: Song[]
	isPlaying: boolean
	isLoading: boolean
	isShuffling: boolean
	repeateMode: RepeateMode
	volume: number // react-native-video usa de 0 a 1
	progress: number // Porcentaje de 0 a 100
	currentTime: number // Segundos
	duration: number // Segundos
	isShown: boolean
	isExpanded: boolean

	// Conexión con el componente
	setPlayerRef: (ref: React.RefObject<VideoRef | null>) => void

	// Acciones principales
	initializeQueue: (songs: Song[], startIndex?: number) => void
	selectSong: (song: Song | null) => void
	setAlbum: (album: Album | null) => void
	resetPlayerState: () => void

	// Controles del reproductor
	togglePlayPause: () => void
	seekTo: (time: number) => void
	setVolume: (volume: number) => void
	handleNext: () => void
	handlePrevious: () => void
	handleChangeRepeatState: () => void

	// Handlers para los eventos del componente <Video>
	handleOnLoad: (data: OnLoadData) => void
	handleOnProgress: (data: OnProgressData) => void
	handleOnEnd: () => void

	// UI State
	setIsShown: (shown: boolean) => void
	setIsExpanded: (expanded: boolean) => void
}

const useMusicStore = createWithEqualityFn<MusicState>((set, get) => ({
	// Estado inicial
	playerRef: null,
	currentSong: null,
	album: null,
	songQueue: [],
	isPlaying: false,
	isLoading: false,
	isShuffling: false,
	repeateMode: RepeateMode.NONE,
	volume: 100,
	progress: 0,
	currentTime: 0,
	duration: 0,
	isShown: false,
	isExpanded: false,

	// Conexión
	setPlayerRef: (ref) => set({ playerRef: ref }),

	// Acciones
	initializeQueue: (songs, startIndex = 0) => {
		set({ songQueue: songs, isShown: true })
		get().selectSong(songs[startIndex])
	},

	selectSong: (song) => {
		set({
			currentSong: song,
			progress: 0,
			currentTime: 0,
			duration: 0,
			isLoading: !!song, // Mostrar carga al seleccionar nueva canción
			isPlaying: !!song, // Empezar a reproducir automáticamente
		})
	},

	setAlbum: (album) => set({ album }),

	resetPlayerState: () => {
		set({
			currentSong: null,
			isPlaying: false,
			isShown: false,
			songQueue: [],
			progress: 0,
			currentTime: 0,
			duration: 0,
		})
	},

	// Controles del reproductor
	togglePlayPause: () => {
		if (get().currentSong) {
			set((state) => ({ isPlaying: !state.isPlaying }))
		}
	},

	seekTo: (time) => {
		get().playerRef?.current?.seek(time)
		set({ currentTime: time })
	},

	setVolume: (volume) => {
		const newVolume = Math.max(0, Math.min(1, volume))
		set({ volume: newVolume })
	},

	handleNext: () => {
		const { currentSong, songQueue, repeateMode } = get()
		const currentIndex = songQueue.findIndex((s) => s.id === currentSong?.id)

		if (currentIndex < songQueue.length - 1) {
			get().selectSong(songQueue[currentIndex + 1])
		} else if (repeateMode === RepeateMode.REPEAT_ALL) {
			get().selectSong(songQueue[0])
		} else {
			// Fin de la cola
			set({ isPlaying: false })
		}
	},

	handlePrevious: () => {
		const { currentSong, songQueue, currentTime, playerRef } = get()

		if (currentTime > 3) {
			playerRef?.current?.seek(0)
			return
		}

		const currentIndex = songQueue.findIndex((s) => s.id === currentSong?.id)
		if (currentIndex > 0) {
			get().selectSong(songQueue[currentIndex - 1])
		} else {
			playerRef?.current?.seek(0) // Reinicia si es la primera canción
		}
	},

	handleChangeRepeatState: () => {
		const currentMode = get().repeateMode
		const nextMode = (currentMode + 1) % 3 // Cicla entre 0, 1, 2
		set({ repeateMode: nextMode })
	},

	// Handlers de eventos del <Video>
	handleOnLoad: (data) => {
		set({
			duration: data.duration,
			isLoading: false,
			isPlaying: true, // Asegurarse de que reproduzca al cargar
		})
	},

	handleOnProgress: (data) => {
		const { duration } = get()
		set({
			currentTime: data.currentTime,
			progress: duration > 0 ? (data.currentTime / duration) * 100 : 0,
		})
	},

	handleOnEnd: () => {
		const { repeateMode, playerRef, handleNext } = get()

		if (repeateMode === RepeateMode.REPEAT_ONE) {
			playerRef?.current?.seek(0)
		} else {
			handleNext()
		}
	},

	// UI State
	setIsShown: (shown) => set({ isShown: shown }),
	setIsExpanded: (expanded) => set({ isExpanded: expanded }),
}))

export default useMusicStore
