import { API, useUpdate } from '@seerial/api';
import type { Album } from '@seerial/domain';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { ModalWrapper } from '@/components/ModalWrapper';
import { useDialogStore } from '@/context/dialog.store';
import { useWebSocketStore } from '@seerial/stores';
import { ImageType } from '@/utils/constants';
import { showToast } from '@/utils/ReactUtils';
import ImageListTab from '../components/ImageListTab';
import AlbumInfoTab from './components/AlbumInfoTab';

function AlbumDialog() {
  const { t } = useTranslation();
  const connectWS = useWebSocketStore((state) => state.connectWS);
  const { albumDialog, closeAlbumDialog } = useDialogStore(
    (state) => ({
      albumDialog: state.albumDialog,
      closeAlbumDialog: state.closeAlbumDialog,
    }),
    shallow,
  );
  const [selectedTab, setSelectedTab] = useState<string | undefined>();

  // Posters
  const [posters, setPosters] = useState<string[]>([]);
  const [localPosterFolder, setLocalPosterFolder] = useState<string>('');
  const [selectedPoster, setSelectedPoster] = useState<string>('');

  //#region ATTRIBUTES
  const [title, setTitle] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [genres, setGenres] = useState<string[]>(['']);
  const { update } = useUpdate<Album>();

  const [album, setAlbum] = useState<Album | undefined>(undefined);
  //#endregion

  useEffect(() => {
    if (albumDialog && albumDialog.albumToEdit) {
      setTitle(albumDialog.albumToEdit.title || '');
      setYear(albumDialog.albumToEdit.year || '');
      setDescription(albumDialog.albumToEdit.description || '');
      setGenres(albumDialog.albumToEdit.genres || []);

      setAlbum(albumDialog.albumToEdit);
      setPosters([]);
      setSelectedPoster(albumDialog.albumToEdit.coverSrc || '');
      setLocalPosterFolder(`img/posters/${albumDialog.albumToEdit.id}`);
      setSelectedTab(t('generalButton'));
    }
  }, [albumDialog]);

  if (!album) return null;

  const handleEditAlbum = async () => {
    await connectWS();

    const response = await update(API.albums.update(album.id), {
      ...album,
      title: title,
      year: year,
      description: description,
      coverSrc: selectedPoster ?? '',
      genres: genres,
    });

    if (!response) {
      showToast('error', 'Error updating episode');
      return;
    }

    closeAlbumDialog();
  };

  const getWindowTitle = () => {
    return `${t('editButton')} ${album.title}`;
  };

  return (
    <ModalWrapper
      title={getWindowTitle()}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <AlbumInfoTab
              title={title}
              setTitle={setTitle}
              year={year}
              setYear={setYear}
              description={description}
              setDescription={setDescription}
              genres={genres}
              setGenres={setGenres}
            />
          ),
        },
        {
          title: t('postersButton'),
          content: (
            <ImageListTab
              imagesList={posters}
              localFolder={localPosterFolder}
              selectImage={setSelectedPoster}
              selectedImage={selectedPoster}
              type={ImageType.SQUARE}
            />
          ),
        },
      ]}
      width="50rem"
      isOpen={albumDialog.isOpen}
      close={closeAlbumDialog}
      onAccept={handleEditAlbum}
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  );
}

export default AlbumDialog;
