import { useGetAllCollections } from '@seerial/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalWrapper } from '@/shared/ui/modal-wrapper';
import { useDialogStore } from '../../../../stores/dialog-store';
import CollectionCard from './components/collection-card';
import CreateCollectionTab from './components/create-collection-tab';

interface CollectionSummary {
  id: string;
  title: string;
  itemCount: number;
}

export default function ManageCollectionsDialog() {
  const { t } = useTranslation();
  const { closeDialog } = useDialogStore();

  const collectionsTabTitle = t('collections');
  const createTabTitle = t('createCollection');

  const [activeTab, setActiveTab] = useState(collectionsTabTitle);

  const { data: collections, isLoading } = useGetAllCollections<CollectionSummary[]>({
    staleTime: 30000,
  });

  const tabs = [
    {
      title: collectionsTabTitle,
      content: (
        <div className="flex flex-col gap-2 p-1">
          {isLoading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : (collections ?? []).length === 0 ? (
            <span className="text-sm text-muted-foreground">{t('noCollections')}</span>
          ) : (
            (collections ?? []).map((c) => (
              <CollectionCard key={c.id} id={c.id} title={c.title} itemCount={c.itemCount} />
            ))
          )}
        </div>
      ),
    },
    {
      title: createTabTitle,
      content: <CreateCollectionTab onCreated={() => setActiveTab(collectionsTabTitle)} />,
    },
  ];

  return (
    <ModalWrapper
      title={t('manageCollections')}
      tabs={tabs}
      isOpen
      close={closeDialog}
      hideButtons
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
