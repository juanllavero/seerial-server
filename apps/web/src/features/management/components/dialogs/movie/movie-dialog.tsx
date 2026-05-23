import { API, useGet } from '@seerial/api';
import type { Movie, UpdateMovieDTO } from '@seerial/domain';
import { shallow } from 'zustand/shallow';
import useEditDialog from '@/features/management/hooks/use-edit-dialog';
import { ImageType } from '@/shared/lib/constants';
import { ModalWrapper } from '@/shared/ui/modal-wrapper';
import { useDialogStore } from '../../../stores/dialog-store';
import GenericFormTab from '../components/generic-form-tab';
import ImageListTab from '../components/image-list-tab';
import { movieInfoConfig, movieTagsConfig } from '../forms-config';
import MediaTab from '../media-tab';

interface MovieImageState {
  logos: string[];
  localLogoFolder: string;
  selectedLogo: string;
  backgrounds: string[];
  localBackgroundFolder: string;
  selectedBackground: string;
  posters: string[];
  localPosterFolder: string;
  selectedPoster: string;
}

function MovieDialog() {
  const { payload, closeDialog } = useDialogStore(
    (state) => ({
      payload: state.payload,
      closeDialog: state.closeDialog,
    }),
    shallow,
  );
  const { id } = payload as { id: string };
  const { data: movie } = useGet<Movie>(API.movies.get(id));

  const { control, images, selectedTab, setSelectedTab, handleUpdate, t } = useEditDialog<
    Movie,
    MovieImageState,
    UpdateMovieDTO
  >({
    entity: movie,
    configs: [movieInfoConfig, movieTagsConfig],
    initialImages: {
      logos: [],
      localLogoFolder: '',
      selectedLogo: '',
      backgrounds: [],
      localBackgroundFolder: '',
      selectedBackground: '',
      posters: [],
      localPosterFolder: '',
      selectedPoster: '',
    },
    getImagesFromEntity: (m) => ({
      logos: m.logosUrls || [],
      backgrounds: m.backgroundsUrls || [],
      posters: m.coversUrls || [],
      selectedLogo: m.logoSrc || '',
      selectedPoster: m.coverSrc || '',
      selectedBackground: m.backgroundSrc || '',
      localLogoFolder: `img/logos/${m.id}`,
      localBackgroundFolder: `img/backgrounds/${m.id}`,
      localPosterFolder: `img/posters/${m.id}`,
    }),
    getExtraSubmitData: (imgs, m) => ({
      logoSrc: imgs.selectedLogo ?? m.logoSrc,
      coverSrc: imgs.selectedPoster ?? m.coverSrc,
      backgroundSrc: imgs.selectedBackground ?? m.backgroundSrc,
    }),
    apiUpdateUrl: movie ? API.movies.update(movie.id) : '',
    errorMessage: 'Error updating movie',
    dtoKeys: [
      'name',
      'nameLock',
      'overview',
      'overviewLock',
      'year',
      'yearLock',
      'tagline',
      'taglineLock',
      'genres',
      'genresLock',
      'productionStudios',
      'productionStudiosLock',
      'directedBy',
      'directedByLock',
      'writtenBy',
      'writtenByLock',
      'creator',
      'creatorLock',
      'musicComposer',
      'musicComposerLock',
      'videoSrc',
      'musicSrc',
      'logoSrc',
      'logosUrls',
      'backgroundSrc',
      'backgroundsUrls',
      'coverSrc',
      'coversUrls',
    ],
  });

  if (!movie) return null;

  return (
    <ModalWrapper
      title={`${t('editButton')} ${movie.name}`}
      tabs={[
        {
          title: t('generalButton'),
          content: <GenericFormTab config={movieInfoConfig} control={control} />,
        },
        {
          title: t('tags'),
          content: <GenericFormTab config={movieTagsConfig} control={control} />,
        },
        { title: t('media'), content: <MediaTab movie={movie} /> },
        {
          title: t('logosButton'),
          content: (
            <ImageListTab
              imagesList={images.logos}
              type={ImageType.LOGO}
              localFolder={images.localLogoFolder}
              selectImage={images.setSelectedLogo}
              selectedImage={images.selectedLogo}
            />
          ),
        },
        {
          title: t('backgroundsButton'),
          content: (
            <ImageListTab
              imagesList={images.backgrounds}
              localFolder={images.localBackgroundFolder}
              selectImage={images.setSelectedBackground}
              selectedImage={images.selectedBackground}
            />
          ),
        },
        {
          title: t('postersButton'),
          content: (
            <ImageListTab
              imagesList={images.posters}
              localFolder={images.localPosterFolder}
              selectImage={images.setSelectedPoster}
              selectedImage={images.selectedPoster}
              type={ImageType.POSTER}
            />
          ),
        },
      ]}
      isOpen={true}
      close={closeDialog}
      onAccept={handleUpdate}
      activeTab={selectedTab}
      onTabChange={setSelectedTab}
    />
  );
}

export default MovieDialog;
