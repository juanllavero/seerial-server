import { API, useGet } from '@seerial/api';
import type { Episode, Series } from '@seerial/domain';
import { shallow } from 'zustand/vanilla/shallow';
import useEditDialog from '@/features/management/hooks/use-edit-dialog';
import { ModalWrapper } from '../../../../../shared/ui/modal-wrapper';
import { useDialogStore } from '../../../stores/dialog-store';
import GenericFormTab from '../components/generic-form-tab';
import ImageListTab from '../components/image-list-tab';
import { episodeInfoConfig } from '../forms-config';
import EpisodeMediaInfoTab from './components/episode-media-info-tab';

interface EpisodeImageState {
  images: string[];
  localFolder: string;
  selectedImage: string;
}

function EpisodeDialog() {
  const { payload, closeDialog } = useDialogStore(
    (state) => ({
      payload: state.payload,
      closeDialog: state.closeDialog,
    }),
    shallow,
  );
  const { id } = payload as { id: string };
  const { data: episode } = useGet<Episode>(API.episodes.get(id));
  const { data: series } = useGet<Series>(
    episode ? API.media.details(`seriesBySeasonId?id=${episode.seasonId}`) : null,
  );

  const { control, images, selectedTab, setSelectedTab, handleUpdate, t } = useEditDialog<
    Episode,
    EpisodeImageState
  >({
    entity: episode,
    configs: [episodeInfoConfig],
    initialImages: { images: [], localFolder: '', selectedImage: '' },
    getImagesFromEntity: (e) => ({
      images: e.video.imgUrls || [],
      selectedImage: e.video.imgSrc || '',
      localFolder: `img/thumbnails/video/${e.id}`,
    }),
    getExtraSubmitData: (imgs, e) => ({
      imgSrc: imgs.selectedImage ?? e.video.imgSrc,
    }),
    apiUpdateUrl: episode ? API.episodes.update(episode.id) : '',
    errorMessage: 'Error updating episode',
  });

  if (!episode || !series) return null;

  const title = `${t('editButton')} ${series.name} - ${episode.name} (${t('seasonLetter')}${episode.seasonNumber}${t('episodeLetter')}${episode.episodeNumber})`;

  return (
    <ModalWrapper
      title={title}
      tabs={[
        {
          title: t('generalButton'),
          content: <GenericFormTab config={episodeInfoConfig} control={control} />,
        },
        {
          title: t('thumbnailsButton'),
          content: (
            <ImageListTab
              imagesList={images.images}
              localFolder={images.localFolder}
              selectImage={images.setSelectedImage}
              selectedImage={images.selectedImage}
            />
          ),
        },
        {
          title: t('details'),
          content: <EpisodeMediaInfoTab video={episode.video} />,
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

export default EpisodeDialog;
