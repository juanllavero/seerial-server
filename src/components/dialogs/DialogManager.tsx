import { useDialogStore } from '@/context/dialog.store'
import DynamicDialog from './DynamicDialog'
import { DialogType } from './dialogRegistry'

function DialogManager() {
  const { open } = useDialogStore()

  const dialogs: DialogType[] = [
    'library',
    'collection',
    'movie',
    'series',
    'season',
    'episode',
    'album',
    'deleteLibrary',
    'deleteSeries',
    'deleteMovie',
    'deleteSeason',
    'deleteEpisode',
    'deleteAlbum',
    'deleteSong',
    'deleteCollection',
    'downloadMedia',
    'identification',
    'episodesGroup',
  ]

  return (
    <>
      {dialogs.map((type) => (
        <DynamicDialog key={type} type={type} isOpen={open === type} />
      ))}
    </>
  )
}

export default DialogManager
