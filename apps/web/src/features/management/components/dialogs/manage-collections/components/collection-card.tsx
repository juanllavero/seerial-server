import { API, useCreate, useDelete, useGetCollectionContent, useGetLibraries } from '@seerial/api';
import type { Library, LibraryItem } from '@seerial/domain';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/shared/lib/react-utils';
import { Button } from '@/shared/ui/button';
import { type StagedItem, MultiLibraryItemPicker } from './item-picker';

interface CollectionContentData {
  movies: LibraryItem[];
  series: LibraryItem[];
  albums: LibraryItem[];
}

interface RemovableItem {
  id: string;
  title: string;
}

interface ItemsGroupProps {
  label: string;
  items: RemovableItem[];
  onRemove: (id: string) => void;
}

function ItemsGroup({ label, items, onRemove }: ItemsGroupProps) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{label}</p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span>{item.title}</span>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${item.title}`}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface CollectionCardProps {
  id: string;
  title: string;
  itemCount: number;
}

interface DeleteActionsProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteActions({ onConfirm, onCancel }: DeleteActionsProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1 px-3 py-3 border-l">
      <span className="text-xs text-muted-foreground mr-1">{t('deleteCollection')}?</span>
      <Button variant="destructive" size="sm" className="h-6 text-xs px-2" onClick={onConfirm}>
        {t('yes') ?? 'Yes'}
      </Button>
      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={onCancel}>
        {t('no') ?? 'No'}
      </Button>
    </div>
  );
}

interface BatchAddPanelProps {
  libraries: Library[];
  excludedIds: string[];
  stagedItems: StagedItem[];
  onStagedItemsChange: (items: StagedItem[]) => void;
  isAdding: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function BatchAddPanel({
  libraries,
  excludedIds,
  stagedItems,
  onStagedItemsChange,
  isAdding,
  onConfirm,
  onCancel,
}: BatchAddPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 pt-1">
      <MultiLibraryItemPicker
        libraries={libraries}
        excludedIds={excludedIds}
        stagedItems={stagedItems}
        onStagedItemsChange={onStagedItemsChange}
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={stagedItems.length === 0 || isAdding} onClick={onConfirm}>
          {t('addItemsToCollection')}
          {stagedItems.length > 0 && (
            <span className="ml-1.5 text-primary-foreground/70">({stagedItems.length})</span>
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t('cancel') ?? 'Cancel'}
        </Button>
      </div>
    </div>
  );
}

export default function CollectionCard({ id, title, itemCount }: CollectionCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [addingItems, setAddingItems] = useState(false);
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isAddingBatch, setIsAddingBatch] = useState(false);

  const { create } = useCreate<void>();
  const { deleteRequest } = useDelete();

  const { data: content, isLoading: contentLoading } =
    useGetCollectionContent<CollectionContentData>(id, {
      enabled: expanded,
    });

  const { data: libraries } = useGetLibraries<Library[]>({
    enabled: addingItems,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['collections', 'content', id] });
    queryClient.invalidateQueries({ queryKey: ['collections', 'getAll'] });
  };

  const handleAddBatch = async () => {
    if (stagedItems.length === 0) return;
    setIsAddingBatch(true);
    try {
      await Promise.all(
        stagedItems.map((item) => {
          let endpoint = '';
          if (item.libraryType === 'Movies') endpoint = API.collections.addMovie(id, item.id);
          else if (item.libraryType === 'Shows') endpoint = API.collections.addSeries(id, item.id);
          else if (item.libraryType === 'Music') endpoint = API.collections.addAlbum(id, item.id);
          return endpoint ? create(endpoint, undefined) : Promise.resolve(null);
        }),
      );
      showToast('success', t('itemAdded'));
      setStagedItems([]);
      setAddingItems(false);
      invalidate();
    } finally {
      setIsAddingBatch(false);
    }
  };

  const handleRemoveMovie = async (movieId: string) => {
    await deleteRequest(API.collections.removeMovie(id, movieId));
    showToast('success', t('itemRemoved'));
    invalidate();
  };

  const handleRemoveSeries = async (seriesId: string) => {
    await deleteRequest(API.collections.removeSeries(id, seriesId));
    showToast('success', t('itemRemoved'));
    invalidate();
  };

  const handleRemoveAlbum = async (albumId: string) => {
    await deleteRequest(API.collections.removeAlbum(id, albumId));
    showToast('success', t('itemRemoved'));
    invalidate();
  };

  const handleDeleteCollection = async () => {
    await deleteRequest(API.collections.delete(id));
    showToast('success', t('collectionDeleted'));
    queryClient.invalidateQueries({ queryKey: ['collections', 'getAll'] });
  };

  const allCurrentIds = [
    ...(content?.movies?.map((m) => m.id) ?? []),
    ...(content?.series?.map((s) => s.id) ?? []),
    ...(content?.albums?.map((a) => a.id) ?? []),
  ];

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Card header */}
      <div className="flex items-center">
        <button
          type="button"
          className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
          onClick={() => {
            setExpanded((v) => !v);
            if (!expanded) {
              setAddingItems(false);
              setStagedItems([]);
              setConfirmingDelete(false);
            }
          }}
        >
          <div className="flex flex-col">
            <span className="font-medium">{title}</span>
            <span className="text-xs text-muted-foreground">
              {itemCount} {t('collectionItems').toLowerCase()}
            </span>
          </div>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Delete button */}
        {confirmingDelete ? (
          <DeleteActions
            onConfirm={handleDeleteCollection}
            onCancel={() => setConfirmingDelete(false)}
          />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            aria-label={t('deleteCollection')}
            className="px-3 py-3 border-l text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t px-4 py-3 flex flex-col gap-3">
          {contentLoading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : (
            <>
              <ItemsGroup
                label="Shows"
                items={content?.series ?? []}
                onRemove={handleRemoveSeries}
              />
              <ItemsGroup
                label="Movies"
                items={content?.movies ?? []}
                onRemove={handleRemoveMovie}
              />
              <ItemsGroup
                label="Albums"
                items={content?.albums ?? []}
                onRemove={handleRemoveAlbum}
              />

              {addingItems ? (
                <BatchAddPanel
                  libraries={libraries ?? []}
                  excludedIds={allCurrentIds}
                  stagedItems={stagedItems}
                  onStagedItemsChange={setStagedItems}
                  isAdding={isAddingBatch}
                  onConfirm={handleAddBatch}
                  onCancel={() => {
                    setAddingItems(false);
                    setStagedItems([]);
                  }}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start mt-1"
                  onClick={() => setAddingItems(true)}
                >
                  <Plus size={14} className="mr-1" />
                  {t('addItemsToCollection')}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
