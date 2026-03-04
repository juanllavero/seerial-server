// store/dialogStore.ts
import {
	Collection,
	Episode,
	Library,
	Movie,
	Season,
	Series,
} from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
import { createWithEqualityFn } from 'zustand/traditional'

// Type of the store state
interface DialogState {
	libraryDialog: {
		isOpen: boolean
		libraryToEdit?: Library // Optional, for editing
	}
	removeLibraryDialog: {
		isOpen: boolean
		libraryToRemove?: string
	}
	collectionDialog: {
		isOpen: boolean
		collectionToEdit?: Collection
	}
	movieDialog: {
		isOpen: boolean
		movieToEdit?: Movie
	}
	seriesDialog: {
		isOpen: boolean
		seriesToEdit?: Series
	}
	seasonDialog: {
		isOpen: boolean
		seasonToEdit?: Season
	}
	episodeDialog: {
		isOpen: boolean
		episodeToEdit?: Episode
	}
	albumDialog: {
		isOpen: boolean
		albumToEdit?: Album
	}
	identificationDialog: {
		isOpen: boolean
		seriesToEdit?: Series
		movieToEdit?: Movie
	}
	episodesGroupDialog: {
		isOpen: boolean
		seriesToEdit?: Series
	}
	downloadMediaDialog: {
		isOpen: boolean
		type: 'music' | 'video'
		seriesToEdit?: Series
		seasonToEdit?: Season
		movieToEdit?: Movie
	}
	// Functions to open and close dialogs
	openLibraryDialog: (libraryToEdit?: Library) => void
	closeLibraryDialog: () => void
	openRemoveLibraryDialog: (libraryToRemove: string) => void
	closeRemoveLibraryDialog: () => void
	openCollectionDialog: (collection: Collection) => void
	closeCollectionDialog: () => void
	openMovieDialog: (movie: Movie) => void
	closeMovieDialog: () => void
	openSeriesDialog: (series: Series) => void
	closeSeriesDialog: () => void
	openSeasonDialog: (season: Season) => void
	closeSeasonDialog: () => void
	openEpisodeDialog: (episode: Episode) => void
	closeEpisodeDialog: () => void
	openAlbumDialog: (album: Album) => void
	closeAlbumDialog: () => void
	openIdentificationDialog: (
		series: Series | undefined,
		movie: Movie | undefined
	) => void
	closeIdentificationDialog: () => void
	openEpisodesGroupDialog: (series: Series) => void
	closeEpisodesGroupDialog: () => void
	openDownloadMediaDialog: (
		type: 'music' | 'video',
		series: Series | undefined,
		season: Season | undefined,
		movie: Movie | undefined
	) => void
	closeDownloadMediaDialog: () => void
}

// Create the store with Zustand
export const useDialogStore = createWithEqualityFn<DialogState>((set) => ({
	// Initial state of the dialogs
	libraryDialog: {
		isOpen: false,
		libraryToEdit: undefined,
	},
	removeLibraryDialog: {
		isOpen: false,
		libraryToRemove: undefined,
	},
	collectionDialog: {
		isOpen: false,
		collectionToEdit: undefined,
	},
	movieDialog: {
		isOpen: false,
		movieToEdit: undefined,
	},
	seriesDialog: {
		isOpen: false,
		seriesToEdit: undefined,
	},
	seasonDialog: {
		isOpen: false,
		seasonToEdit: undefined,
	},
	episodeDialog: {
		isOpen: false,
		episodeToEdit: undefined,
	},
	albumDialog: {
		isOpen: false,
		albumToEdit: undefined,
	},
	identificationDialog: {
		isOpen: false,
		seriesToEdit: undefined,
		movieToEdit: undefined,
	},
	episodesGroupDialog: {
		isOpen: false,
		seriesToEdit: undefined,
	},
	downloadMediaDialog: {
		isOpen: false,
		type: 'music',
		seriesToEdit: undefined,
		seasonToEdit: undefined,
		movieToEdit: undefined,
	},

	// Functions for LibraryDialog
	openLibraryDialog: (libraryToEdit?: Library) =>
		set({
			libraryDialog: {
				isOpen: true,
				libraryToEdit, // May be undefined if not editing
			},
		}),
	closeLibraryDialog: () =>
		set({
			libraryDialog: {
				isOpen: false,
				libraryToEdit: undefined, // Clear the object when closing
			},
		}),

	// Functions for RemoveLibraryDialog
	openRemoveLibraryDialog: (libraryToRemove: string) =>
		set({
			removeLibraryDialog: {
				isOpen: true,
				libraryToRemove,
			},
		}),
	closeRemoveLibraryDialog: () =>
		set({
			removeLibraryDialog: {
				isOpen: false,
				libraryToRemove: undefined, // Clear when closing
			},
		}),

	// Functions for CollectionDialog
	openCollectionDialog: (collectionToEdit: Collection) =>
		set({
			collectionDialog: {
				isOpen: true,
				collectionToEdit,
			},
		}),
	closeCollectionDialog: () =>
		set({
			collectionDialog: {
				isOpen: false,
				collectionToEdit: undefined, // Clear when closing
			},
		}),

	// Functions for MovieDialog
	openMovieDialog: (movieToEdit: Movie) =>
		set({
			movieDialog: {
				isOpen: true,
				movieToEdit,
			},
		}),
	closeMovieDialog: () =>
		set({
			movieDialog: {
				isOpen: false,
				movieToEdit: undefined, // Clear when closing
			},
		}),

	// Functions for SeriesDialog
	openSeriesDialog: (seriesToEdit: Series) =>
		set({
			seriesDialog: {
				isOpen: true,
				seriesToEdit,
			},
		}),
	closeSeriesDialog: () =>
		set({
			seriesDialog: {
				isOpen: false,
				seriesToEdit: undefined, // Clear when closing
			},
		}),

	// Functions for SeasonDialog
	openSeasonDialog: (seasonToEdit: Season) =>
		set({
			seasonDialog: {
				isOpen: true,
				seasonToEdit,
			},
		}),
	closeSeasonDialog: () =>
		set({
			seasonDialog: {
				isOpen: false,
				seasonToEdit: undefined, // Clear when closing
			},
		}),

	// Functions for EpisodeDialog
	openEpisodeDialog: (episodeToEdit: Episode) =>
		set({
			episodeDialog: {
				isOpen: true,
				episodeToEdit,
			},
		}),
	closeEpisodeDialog: () =>
		set({
			episodeDialog: {
				isOpen: false,
				episodeToEdit: undefined, // Clear when closing
			},
		}),

	// Functions for AlbumDialog
	openAlbumDialog: (albumToEdit: Album) =>
		set({
			albumDialog: {
				isOpen: true,
				albumToEdit,
			},
		}),
	closeAlbumDialog: () =>
		set({
			albumDialog: {
				isOpen: false,
				albumToEdit: undefined, // Clear when closing
			},
		}),

	openIdentificationDialog: (
		series: Series | undefined,
		movie: Movie | undefined
	) =>
		set({
			identificationDialog: {
				isOpen: true,
				seriesToEdit: series,
				movieToEdit: movie,
			},
		}),
	closeIdentificationDialog: () =>
		set({
			identificationDialog: {
				isOpen: false,
				seriesToEdit: undefined,
				movieToEdit: undefined,
			},
		}),
	openEpisodesGroupDialog: (series: Series) =>
		set({
			episodesGroupDialog: {
				isOpen: true,
				seriesToEdit: series,
			},
		}),
	closeEpisodesGroupDialog: () =>
		set({
			episodesGroupDialog: {
				isOpen: false,
				seriesToEdit: undefined,
			},
		}),
	openDownloadMediaDialog: (
		type: 'music' | 'video',
		series: Series | undefined,
		season: Season | undefined,
		movie: Movie | undefined
	) =>
		set({
			downloadMediaDialog: {
				isOpen: true,
				type: type,
				seriesToEdit: series,
				seasonToEdit: season,
				movieToEdit: movie,
			},
		}),
	closeDownloadMediaDialog: () =>
		set({
			downloadMediaDialog: {
				isOpen: false,
				type: 'music',
				seriesToEdit: undefined,
				seasonToEdit: undefined,
				movieToEdit: undefined,
			},
		}),
}))
