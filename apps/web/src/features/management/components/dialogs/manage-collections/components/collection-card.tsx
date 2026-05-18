import {
  API,
  useCreate,
  useDelete,
  useGetCollectionContent,
  useGetLibraries,
  useGetLibraryContent,
} from '@seerial/api';
import type { Library, LibraryItem } from '@seerial/domain';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/shared/lib/react-utils';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

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
              className="text-muted-foreground hover:text-destructive"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AddItemPanelProps {
  libraries: Library[];
  selectedLibraryId: string | undefined;
  onLibraryChange: (id: string) => void;
  availableItems: LibraryItem[];
  isLoading: boolean;
  onAdd: (item: LibraryItem) => void;
  onCancel: () => void;
}

function AddItemPanel({
  libraries,
  selectedLibraryId,
  onLibraryChange,
  availableItems,
  isLoading,
  onAdd,
  onCancel,
}: AddItemPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <Select value={selectedLibraryId ?? ''} onValueChange={onLibraryChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('selectLibrary')} />
        </SelectTrigger>
        <SelectContent>
          {libraries.map((lib) => (
            <SelectItem key={lib.id} value={lib.id}>
              {lib.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedLibraryId &&
        (isLoading ? (
          <span className="text-sm text-muted-foreground">Loading...</span>
        ) : (
          <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {availableItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.title}</span>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  aria-label={`Add ${item.title}`}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Plus size={14} />
                </button>
              </li>
            ))}
            {availableItems.length === 0 && (
              <li className="text-sm text-muted-foreground">No items available</li>
            )}
          </ul>
        ))}

      <Button variant="ghost" size="sm" className="self-start" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

interface ExpandedContentProps {
  content: CollectionContentData | undefined;
  contentLoading: boolean;
  addingItem: boolean;
  setAddingItem: (v: boolean) => void;
  selectedLibraryId: string | undefined;
  setSelectedLibraryId: (v: string | undefined) => void;
  libraries: Library[];
  availableItems: LibraryItem[];
  libraryContentLoading: boolean;
  onRemoveSeries: (id: string) => void;
  onRemoveMovie: (id: string) => void;
  onRemoveAlbum: (id: string) => void;
  onAdd: (item: LibraryItem) => void;
}

function ExpandedContent({
  content,
  contentLoading,
  addingItem,
  setAddingItem,
  selectedLibraryId,
  setSelectedLibraryId,
  libraries,
  availableItems,
  libraryContentLoading,
  onRemoveSeries,
  onRemoveMovie,
  onRemoveAlbum,
  onAdd,
}: ExpandedContentProps) {
  const { t } = useTranslation();
  if (contentLoading) return <span className="text-sm text-muted-foreground">Loading...</span>;
  return (
    <>
      <ItemsGroup label="Shows" items={content?.series ?? []} onRemove={onRemoveSeries} />
      <ItemsGroup label="Movies" items={content?.movies ?? []} onRemove={onRemoveMovie} />
      <ItemsGroup label="Albums" items={content?.albums ?? []} onRemove={onRemoveAlbum} />
      {addingItem ? (
        <AddItemPanel
          libraries={libraries}
          selectedLibraryId={selectedLibraryId}
          onLibraryChange={(v) => setSelectedLibraryId(v)}
          availableItems={availableItems}
          isLoading={libraryContentLoading}
          onAdd={onAdd}
          onCancel={() => {
            setAddingItem(false);
            setSelectedLibraryId(undefined);
          }}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="self-start mt-1"
          onClick={() => setAddingItem(true)}
        >
          <Plus size={14} className="mr-1" />
          {t('addItemsToCollection')}
        </Button>
      )}
    </>
  );
}

interface CollectionCardProps {
  id: string;
  title: string;
  itemCount: number;
}

export default function CollectionCard({ id, title, itemCount }: CollectionCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | undefined>(undefined);

  const { create } = useCreate<void>();
  const { deleteRequest } = useDelete();

  const { data: content, isLoading: contentLoading } =
    useGetCollectionContent<CollectionContentData>(id, {
      enabled: expanded,
    });

  const { data: libraries } = useGetLibraries<Library[]>({
    enabled: addingItem,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const selectedLibrary = libraries?.find((l) => l.id === selectedLibraryId);

  const { data: libraryContent, isLoading: libraryContentLoading } = useGetLibraryContent<
    LibraryItem[]
  >(selectedLibraryId ?? '', {
    enabled: addingItem && !!selectedLibraryId,
    params: { type: selectedLibrary?.type ?? '' },
    staleTime: 30000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['collections', 'content', id] });
    queryClient.invalidateQueries({ queryKey: ['collections', 'getAll'] });
  };

  const handleAddItem = async (item: LibraryItem) => {
    if (!selectedLibrary) return;
    let endpoint = '';
    if (selectedLibrary.type === 'Movies') endpoint = API.collections.addMovie(id, item.id);
    else if (selectedLibrary.type === 'Shows') endpoint = API.collections.addSeries(id, item.id);
    else if (selectedLibrary.type === 'Music') endpoint = API.collections.addAlbum(id, item.id);
    if (!endpoint) return;
    await create(endpoint, undefined);
    showToast('success', t('itemAdded'));
    invalidate();
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

  const allCurrentIds = [
    ...(content?.movies?.map((m) => m.id) ?? []),
    ...(content?.series?.map((s) => s.id) ?? []),
    ...(content?.albums?.map((a) => a.id) ?? []),
  ];

  const availableItems = libraryContent?.filter((item) => !allCurrentIds.includes(item.id)) ?? [];

  return (
    <div className="border rounded-md overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-col">
          <span className="font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">
            {itemCount} {t('collectionItems').toLowerCase()}
          </span>
        </div>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {expanded && (
        <div className="border-t px-4 py-3 flex flex-col gap-3">
          <ExpandedContent
            content={content}
            contentLoading={contentLoading}
            addingItem={addingItem}
            setAddingItem={setAddingItem}
            selectedLibraryId={selectedLibraryId}
            setSelectedLibraryId={setSelectedLibraryId}
            libraries={libraries ?? []}
            availableItems={availableItems}
            libraryContentLoading={libraryContentLoading}
            onRemoveSeries={handleRemoveSeries}
            onRemoveMovie={handleRemoveMovie}
            onRemoveAlbum={handleRemoveAlbum}
            onAdd={handleAddItem}
          />
        </div>
      )}
    </div>
  );
}
