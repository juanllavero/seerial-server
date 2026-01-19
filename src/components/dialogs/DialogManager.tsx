import { useDialogStore } from '@/context/dialog.context'
import { shallow } from 'zustand/shallow'
import DynamicDialog from './DynamicDialog'

function DialogManager() {
  const {
    libraryDialog,
    removeLibraryDialog,
    collectionDialog,
    movieDialog,
    seriesDialog,
    seasonDialog,
    episodeDialog,
    albumDialog,
    songDialog,
    identificationDialog,
    episodesGroupDialog,
    downloadMediaDialog,
  } = useDialogStore(
    (state) => ({
      libraryDialog: state.libraryDialog,
      removeLibraryDialog: state.removeLibraryDialog,
      collectionDialog: state.collectionDialog,
      movieDialog: state.movieDialog,
      seriesDialog: state.seriesDialog,
      seasonDialog: state.seasonDialog,
      episodeDialog: state.episodeDialog,
      albumDialog: state.albumDialog,
      songDialog: state.songDialog,
      identificationDialog: state.identificationDialog,
      episodesGroupDialog: state.episodesGroupDialog,
      downloadMediaDialog: state.downloadMediaDialog,
    }),
    shallow,
  )

  return (
    <>
      <DynamicDialog type="library" isOpen={libraryDialog.isOpen} />
      <DynamicDialog type="removeLibrary" isOpen={removeLibraryDialog.isOpen} />
      <DynamicDialog type="collection" isOpen={collectionDialog.isOpen} />
      <DynamicDialog type="movie" isOpen={movieDialog.isOpen} />
      <DynamicDialog type="series" isOpen={seriesDialog.isOpen} />
      <DynamicDialog type="season" isOpen={seasonDialog.isOpen} />
      <DynamicDialog type="episode" isOpen={episodeDialog.isOpen} />
      <DynamicDialog type="album" isOpen={albumDialog.isOpen} />
      <DynamicDialog type="downloadMedia" isOpen={downloadMediaDialog.isOpen} />
      <DynamicDialog
        type="identification"
        isOpen={identificationDialog.isOpen}
      />
      <DynamicDialog type="episodesGroup" isOpen={episodesGroupDialog.isOpen} />
    </>
  )
}

export default DialogManager
