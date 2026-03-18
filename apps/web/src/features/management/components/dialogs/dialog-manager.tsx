import { useDialogStore } from '../../stores/dialog-store';
import type { DialogType } from './dialog-registry';
import DynamicDialog from './dynamic-dialog';

function DialogManager() {
  const { open } = useDialogStore();

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
  ];

  return (
    <>
      {dialogs.map((type) => (
        <DynamicDialog key={type} type={type} isOpen={open === type} />
      ))}
    </>
  );
}

export default DialogManager;
