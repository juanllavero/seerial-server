import { API, useGetCollection, useUpdate } from '@seerial/api';
import type { Collection } from '@seerial/domain';
import { useWebSocketStore } from '@seerial/stores';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import useFormState from '@/shared/hooks/use-form-state';
import { ImageType } from '@/shared/lib/constants';
import { showToast } from '@/shared/lib/react-utils';
import { ModalWrapper } from '@/shared/ui/modal-wrapper';
import { useDialogStore } from '../../../stores/dialog-store';
import ImageListTab from '../components/image-list-tab';
import CollectionInfoTab from './components/collection-info-tab';

interface CollectionFormState {
  title: string;
  description: string;
  covers: string[];
  localCoverFolder: string;
  selectedCover: string;
  backgrounds: string[];
  localBackgroundFolder: string;
  selectedBackground: string;
}

function CollectionDialog() {
  const { t } = useTranslation();
  const connectWS = useWebSocketStore((state) => state.connectWS);
  const { payload, closeDialog } = useDialogStore(
    (state) => ({
      payload: state.payload,
      closeDialog: state.closeDialog,
    }),
    shallow,
  );
  const { id } = payload as { id: string };
  const { data: collection } = useGetCollection(id);

  const [selectedTab, setSelectedTab] = useState<string | undefined>();
  const { update } = useUpdate<Collection>();

  const form = useFormState<CollectionFormState>({
    title: '',
    description: '',
    covers: [],
    localCoverFolder: '',
    selectedCover: '',
    backgrounds: [],
    localBackgroundFolder: '',
    selectedBackground: '',
  });
  const { resetFormState } = form;

  useEffect(() => {
    if (!collection) return;

    resetFormState({
      title: collection.title ?? '',
      description: collection.description ?? '',
      covers: collection.coversUrls ?? [],
      selectedCover: collection.coverSrc ?? '',
      localCoverFolder: `img/posters/${collection.id}`,
      backgrounds: collection.backgroundsUrls ?? [],
      selectedBackground: collection.backgroundSrc ?? '',
      localBackgroundFolder: `img/backgrounds/${collection.id}`,
    });
    setSelectedTab(t('generalButton'));
  }, [collection, resetFormState, t]);

  if (!collection) return null;

  const handleEditCollection = async () => {
    await connectWS();

    const response = await update(API.collections.update(collection.id), {
      ...collection,
      title: form.title,
      description: form.description,
      coverSrc: form.selectedCover,
      backgroundSrc: form.selectedBackground,
    });

    if (!response) {
      showToast('error', 'Error updating collection');
      return;
    }

    closeDialog();
  };

  const getWindowTitle = () => {
    return `${t('editButton')} ${collection.title}`;
  };

  return (
    <ModalWrapper
      title={getWindowTitle()}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <CollectionInfoTab
              title={form.title}
              setTitle={form.setTitle}
              description={form.description}
              setDescription={form.setDescription}
            />
          ),
        },
        {
          title: t('postersButton'),
          content: (
            <ImageListTab
              type={ImageType.POSTER}
              imagesList={form.covers}
              localFolder={form.localCoverFolder}
              selectImage={form.setSelectedCover}
              selectedImage={form.selectedCover}
            />
          ),
        },
        {
          title: t('backgroundsButton'),
          content: (
            <ImageListTab
              imagesList={form.backgrounds}
              localFolder={form.localBackgroundFolder}
              selectImage={form.setSelectedBackground}
              selectedImage={form.selectedBackground}
            />
          ),
        },
      ]}
      width="50rem"
      isOpen={true}
      close={closeDialog}
      onAccept={handleEditCollection}
      activeTab={selectedTab}
      onTabChange={setSelectedTab}
    />
  );
}

export default CollectionDialog;
