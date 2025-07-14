import { createWithEqualityFn } from 'zustand/traditional'

interface DataState {
	selectedLibraryId: string | null
	selectedCollectionId: string | null
	selectedMovieId: string | null
	selectedSeriesId: string | null
	selectedSeasonId: string | null
	selectedEpisodeId: string | null
	selectedVideoId: string | null
	selectedAlbumId: string | null
	selectedSongId: string | null
	currentBackground: string | undefined
	isContent: boolean
	loadingContent: boolean

	// GET
	selectLibrary: (libraryId: string | null) => void
	selectCollection: (collectionId: string | null) => void
	selectMovie: (movieId: string | null) => void
	selectSeries: (seriesId: string | null) => void
	selectSeason: (seasonId: string | null) => void
	selectEpisode: (episodeId: string | null) => void
	selectVideo: (videoId: string | null) => void
	selectAlbum: (albumId: string | null) => void
	selectSong: (songId: string | null) => void

	// SET
	setCurrentBackground: (background: string | undefined) => void
	setIsContent: (isContent: boolean) => void
	setLoadingContent: (loadingContent: boolean) => void
}

const useDataStore = createWithEqualityFn<DataState>((set) => ({
	selectedLibraryId: null,
	selectedCollectionId: null,
	selectedMovieId: null,
	selectedSeriesId: null,
	selectedSeasonId: null,
	selectedEpisodeId: null,
	selectedVideoId: null,
	selectedAlbumId: null,
	selectedSongId: null,
	currentBackground: undefined,
	isContent: false,
	loadingContent: true,

	selectLibrary(libraryId: string | null) {
		set(() => ({
			selectedLibraryId: libraryId,
		}))
	},

	selectCollection(collectionId: string | null) {
		set(() => ({
			selectedCollectionId: collectionId,
		}))
	},

	selectMovie(movieId: string | null) {
		set(() => ({
			selectedMovieId: movieId,
		}))
	},

	selectSeries(seriesId: string | null) {
		set(() => ({
			selectedSeriesId: seriesId,
		}))
	},

	selectSeason(seasonId: string | null) {
		set(() => ({
			selectedSeasonId: seasonId,
		}))
	},

	selectEpisode(episodeId: string | null) {
		set(() => ({
			selectedEpisodeId: episodeId,
		}))
	},

	selectVideo(videoId: string | null) {
		set(() => ({
			selectedVideoId: videoId,
		}))
	},

	selectAlbum(albumId: string | null) {
		set(() => ({
			selectedAlbumId: albumId,
		}))
	},

	selectSong(songId: string | null) {
		set(() => ({
			selectedSongId: songId,
		}))
	},

	setCurrentBackground(background: string | undefined) {
		set(() => ({
			currentBackground: background,
		}))
	},

	setIsContent(isContent: boolean) {
		set(() => ({
			isContent: isContent,
		}))
	},

	setLoadingContent(loadingContent: boolean) {
		set(() => ({
			loadingContent: loadingContent,
		}))
	},
}))

export default useDataStore
