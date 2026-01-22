import { useDialogStore } from '@/context/dialog.context'
import {
  Collection,
  Episode,
  Library,
  Movie,
  Season,
  Series,
} from '@/data/interfaces/Media'
import { Album, Song } from '@/data/interfaces/Music'

export function useDialog() {
  const store = useDialogStore()

  return {
    // Library dialogs
    openLibraryDialog: (library?: Library) => store.openLibraryDialog(library),
    openRemoveLibraryDialog: (libraryId: string) =>
      store.openRemoveLibraryDialog(libraryId),

    // Collection dialogs
    openCollectionDialog: (collection: Collection) =>
      store.openCollectionDialog(collection),

    // Movie dialogs
    openMovieDialog: (movie: Movie) => store.openMovieDialog(movie),

    // Series dialogs
    openSeriesDialog: (series: Series) => store.openSeriesDialog(series),

    // Season dialogs
    openSeasonDialog: (season: Season) => store.openSeasonDialog(season),

    // Episode dialogs
    openEpisodeDialog: (episode: Episode) => store.openEpisodeDialog(episode),

    // Album dialogs
    openAlbumDialog: (album: Album) => store.openAlbumDialog(album),

    // Song dialogs
    openSongDialog: (song: Song) => store.openSongDialog(song),

    // Identification dialogs
    openIdentificationDialog: (series?: Series, movie?: Movie) =>
      store.openIdentificationDialog(series, movie),

    // Episodes group dialogs
    openEpisodesGroupDialog: (series: Series) =>
      store.openEpisodesGroupDialog(series),

    // Download media dialogs
    openDownloadMediaDialog: (
      type: 'music' | 'video',
      series?: Series,
      season?: Season,
      movie?: Movie,
    ) => store.openDownloadMediaDialog(type, series, season, movie),
  }
}
