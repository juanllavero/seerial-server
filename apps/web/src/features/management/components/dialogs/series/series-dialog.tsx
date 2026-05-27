import { API, useGet } from '@seerial/api';
import type { Series, UpdateSeriesDTO } from '@seerial/domain';
import { shallow } from 'zustand/shallow';
import useEditDialog from '@/features/management/hooks/use-edit-dialog';
import { ImageType } from '@/shared/lib/constants';
import { ModalWrapper } from '@/shared/ui/modal-wrapper';
import { useDialogStore } from '../../../stores/dialog-store';
import GenericFormTab from '../components/generic-form-tab';
import ImageListTab from '../components/image-list-tab';
import { seriesInfoConfig, seriesTagsConfig } from '../forms-config';
import MediaTab from '../media-tab';

interface SeriesImageState {
  logos: string[];
  localLogoFolder: string;
  selectedLogo: string;
  posters: string[];
  localPosterFolder: string;
  selectedPoster: string;
}

function SeriesDialog() {
  const { payload, closeDialog } = useDialogStore(
    (state) => ({
      payload: state.payload,
      closeDialog: state.closeDialog,
    }),
    shallow,
  );
  const { id } = payload as { id: string };
  const { data: series } = useGet<Series>(API.series.get(id));

  const { control, images, selectedTab, setSelectedTab, handleUpdate, t } = useEditDialog<
    Series,
    SeriesImageState,
    UpdateSeriesDTO
  >({
    entity: series,
    configs: [seriesInfoConfig, seriesTagsConfig],
    initialImages: {
      logos: [],
      localLogoFolder: '',
      selectedLogo: '',
      posters: [],
      localPosterFolder: '',
      selectedPoster: '',
    },
    getImagesFromEntity: (s) => ({
      logos: s.logosUrls || [],
      posters: s.coversUrls || [],
      selectedLogo: s.logoSrc || '',
      selectedPoster: s.coverSrc || '',
      localLogoFolder: s.folder ? `${s.folder}/media` : '',
      localPosterFolder: s.folder ? `${s.folder}/media` : '',
    }),
    getExtraSubmitData: (imgs, s) => ({
      logoSrc: imgs.selectedLogo ?? s.logoSrc,
      coverSrc: imgs.selectedPoster ?? s.coverSrc,
    }),
    apiUpdateUrl: series ? API.series.update(series.id) : '',
    errorMessage: 'Error updating series',
    dtoKeys: [
      'name',
      'nameLock',
      'overview',
      'overviewLock',
      'year',
      'yearLock',
      'score',
      'tagline',
      'taglineLock',
      'logoSrc',
      'logosUrls',
      'coverSrc',
      'coversUrls',
      'productionStudios',
      'productionStudiosLock',
      'creator',
      'creatorLock',
      'musicComposer',
      'musicComposerLock',
      'genres',
      'genresLock',
      'preferAudioLan',
      'preferSubLan',
      'subsMode',
      'folder',
      'episodeGroupId',
      'analyzingFiles',
    ],
  });

  if (!series) return null;

  return (
    <ModalWrapper
      title={`${t('editButton')} ${series.name}`}
      tabs={[
        {
          title: t('generalButton'),
          content: <GenericFormTab config={seriesInfoConfig} control={control} />,
        },
        {
          title: t('tags'),
          content: <GenericFormTab config={seriesTagsConfig} control={control} />,
        },
        { title: t('media'), content: <MediaTab series={series} /> },
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

export default SeriesDialog;
