import { API, useCreate, useGetLibraries, useGetLibraryContent } from '@seerial/api';
import type { Library, LibraryItem } from '@seerial/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/shared/lib/react-utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

interface CreateCollectionBody {
  title: string;
  description?: string;
  movieIds?: string[];
  seriesIds?: string[];
  albumIds?: string[];
}

interface Collection {
  id: string;
  title: string;
}

interface CreateCollectionTabProps {
  onCreated?: () => void;
}

function buildCollectionBody(
  name: string,
  description: string,
  selectedItems: LibraryItem[],
  selectedLibrary: Library | undefined,
): CreateCollectionBody {
  const ids = selectedItems.map((i) => i.id);
  const movieIds = selectedLibrary?.type === 'Movies' ? ids : [];
  const seriesIds = selectedLibrary?.type === 'Shows' ? ids : [];
  const albumIds = selectedLibrary?.type === 'Music' ? ids : [];
  return {
    title: name.trim(),
    ...(description.trim() ? { description: description.trim() } : {}),
    ...(movieIds.length > 0 ? { movieIds } : {}),
    ...(seriesIds.length > 0 ? { seriesIds } : {}),
    ...(albumIds.length > 0 ? { albumIds } : {}),
  };
}

export default function CreateCollectionTab({ onCreated }: CreateCollectionTabProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<LibraryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { create } = useCreate<Collection>();

  const { data: libraries } = useGetLibraries<Library[]>({
    staleTime: Number.POSITIVE_INFINITY,
  });

  const selectedLibrary = libraries?.find((l) => l.id === selectedLibraryId);

  const { data: libraryContent, isLoading: libraryContentLoading } = useGetLibraryContent<
    LibraryItem[]
  >(selectedLibraryId ?? '', {
    enabled: !!selectedLibraryId,
    params: { type: selectedLibrary?.type ?? '' },
    staleTime: 30000,
  });

  const toggleItem = (item: LibraryItem) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item],
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);

    const body = buildCollectionBody(name, description, selectedItems, selectedLibrary);

    try {
      const result = await create(API.collections.create, body as Partial<Collection>);
      if (result) {
        showToast('success', t('collectionCreated'));
        queryClient.invalidateQueries({ queryKey: ['collections', 'getAll'] });
        setName('');
        setDescription('');
        setSelectedLibraryId(undefined);
        setSelectedItems([]);
        onCreated?.();
      } else {
        showToast('error', t('collectionNameExists'));
      }
    } catch {
      showToast('error', t('createCollectionError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex flex-col gap-1">
        <Label htmlFor="collection-name">{t('name')} *</Label>
        <Input
          id="collection-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('name')}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="collection-description">{t('description') ?? 'Description'}</Label>
        <Input
          id="collection-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`${t('description') ?? 'Description'} (${t('optionalLabel') ?? 'optional'})`}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t('addItemsToCollection')}</Label>
        <Select
          value={selectedLibraryId ?? ''}
          onValueChange={(v) => {
            setSelectedLibraryId(v);
            setSelectedItems([]);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectLibrary')} />
          </SelectTrigger>
          <SelectContent>
            {(libraries ?? []).map((lib) => (
              <SelectItem key={lib.id} value={lib.id}>
                {lib.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedLibraryId &&
          (libraryContentLoading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : (
            <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto border rounded-md p-2">
              {(libraryContent ?? []).map((item) => {
                const isSelected = selectedItems.some((i) => i.id === item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleItem(item)}
                      className={`w-full text-left text-sm px-2 py-1 rounded transition-colors ${
                        isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      {item.title}
                    </button>
                  </li>
                );
              })}
              {(libraryContent ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground px-2 py-1">No items</li>
              )}
            </ul>
          ))}
      </div>

      <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting} className="self-start">
        {t('createCollection')}
      </Button>
    </div>
  );
}
