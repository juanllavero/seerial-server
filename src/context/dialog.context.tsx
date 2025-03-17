// store/dialogStore.ts
import { Episode, Library, Season, Series } from '@/data/interfaces/Media'
import { create } from 'zustand'

// Type of the store state
interface DialogState {
  libraryDialog: {
    isOpen: boolean
    libraryToEdit?: Library // Optional, for editing
  }
  removeLibraryDialog: {
    isOpen: boolean
    libraryToRemove?: Library
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
  // Functions to open and close dialogs
  openLibraryDialog: (libraryToEdit?: Library) => void
  closeLibraryDialog: () => void
  openRemoveLibraryDialog: (libraryToRemove: Library) => void
  closeRemoveLibraryDialog: () => void
  openSeriesDialog: (series: Series) => void
  closeSeriesDialog: () => void
  openSeasonDialog: (season: Season) => void
  closeSeasonDialog: () => void
  openEpisodeDialog: (episode: Episode) => void
  closeEpisodeDialog: () => void
}

// Create the store with Zustand
export const useDialogStore = create<DialogState>((set) => ({
  // Initial state of the dialogs
  libraryDialog: {
    isOpen: false,
    libraryToEdit: undefined,
  },
  removeLibraryDialog: {
    isOpen: false,
    libraryToRemove: undefined,
  },
  seriesDialog: {
    isOpen: false,
    series: undefined,
  },
  seasonDialog: {
    isOpen: false,
    season: undefined,
  },
  episodeDialog: {
    isOpen: false,
    episode: undefined,
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
  openRemoveLibraryDialog: (libraryToRemove: Library) =>
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
}))
