import { API, useDelete } from '@seerial/api';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AlertWrapper from '@/components/AlertWrapper';
import { useDialogStore } from '@/context/dialog.store';
import { useWebSocketStore } from '@seerial/stores';
import { showToast } from '@/utils/ReactUtils';

type DeleteDialogName =
  | 'deleteLibrary'
  | 'deleteSeries'
  | 'deleteMovie'
  | 'deleteSeason'
  | 'deleteEpisode'
  | 'deleteAlbum'
  | 'deleteSong'
  | 'deleteCollection';

interface DeleteConfig {
  titleKey: string;
  descriptionKey: string;
  endpoint: (id: string) => string;
  navigateTo?: string;
}

const deleteConfigMap: Record<DeleteDialogName, DeleteConfig> = {
  deleteLibrary: {
    titleKey: 'deleteLibrary',
    descriptionKey: 'deleteLibraryMessage',
    endpoint: (id) => API.libraries.delete(id),
    navigateTo: '/home',
  },
  deleteSeries: {
    titleKey: 'deleteSeries',
    descriptionKey: 'deleteSeriesMessage',
    endpoint: (id) => API.series.delete(id),
  },
  deleteMovie: {
    titleKey: 'deleteMovie',
    descriptionKey: 'deleteMovieMessage',
    endpoint: (id) => API.movies.delete(id),
  },
  deleteSeason: {
    titleKey: 'deleteSeason',
    descriptionKey: 'deleteSeasonMessage',
    endpoint: (id) => API.seasons.delete(id),
  },
  deleteEpisode: {
    titleKey: 'deleteEpisode',
    descriptionKey: 'deleteEpisodeMessage',
    endpoint: (id) => API.episodes.delete(id),
  },
  deleteAlbum: {
    titleKey: 'deleteAlbum',
    descriptionKey: 'deleteAlbumMessage',
    endpoint: (id) => API.albums.delete(id),
  },
  deleteSong: {
    titleKey: 'deleteSong',
    descriptionKey: 'deleteSongMessage',
    endpoint: (id) => API.songs.delete(id),
  },
  deleteCollection: {
    titleKey: 'deleteCollection',
    descriptionKey: 'deleteCollectionMessage',
    endpoint: (id) => API.collections.delete(id),
  },
};

function DeleteDialog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { error, deleteRequest } = useDelete();
  const connectWS = useWebSocketStore((state) => state.connectWS);
  const { open, payload, closeDialog } = useDialogStore();

  const dialogType = open as DeleteDialogName;
  const config = deleteConfigMap[dialogType];
  const { id } = payload as { id: string };

  return (
    <AlertWrapper
      openDialog={true} // DynamicDialog manages it
      title={t(config.titleKey)}
      description={t(config.descriptionKey)}
      actionMessage={t('removeButton')}
      action={async () => {
        connectWS();
        const deleted = await deleteRequest(config.endpoint(id));

        if (!deleted) showToast('error', error || 'Error deleting item');

        await queryClient.invalidateQueries({ queryKey: ['crud'] });
        if (config.navigateTo) navigate(config.navigateTo);
        closeDialog();
      }}
      isDeleteAlert
      closeDialog={closeDialog}
    />
  );
}

export default DeleteDialog;
