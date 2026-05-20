import { API, useCreate, useGetLibraries } from '@seerial/api';
import type { Library } from '@seerial/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/shared/lib/react-utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { type StagedItem, MultiLibraryItemPicker } from './item-picker';

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
  stagedItems: StagedItem[],
): CreateCollectionBody {
  const movieIds = stagedItems.filter((i) => i.libraryType === 'Movies').map((i) => i.id);
  const seriesIds = stagedItems.filter((i) => i.libraryType === 'Shows').map((i) => i.id);
  const albumIds = stagedItems.filter((i) => i.libraryType === 'Music').map((i) => i.id);
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
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { create } = useCreate<Collection>();

  const { data: libraries } = useGetLibraries<Library[]>({
    staleTime: Number.POSITIVE_INFINITY,
  });

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);

    const body = buildCollectionBody(name, description, stagedItems);

    try {
      const result = await create(API.collections.create, body as Partial<Collection>);
      if (result) {
        showToast('success', t('collectionCreated'));
        queryClient.invalidateQueries({ queryKey: ['collections', 'getAll'] });
        setName('');
        setDescription('');
        setStagedItems([]);
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
    <div className="flex flex-col gap-5 p-1">
      <div className="flex flex-col gap-3">
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
      </div>

      {(libraries ?? []).length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>{t('addItemsToCollection')}</Label>
          <MultiLibraryItemPicker
            libraries={libraries ?? []}
            stagedItems={stagedItems}
            onStagedItemsChange={setStagedItems}
          />
        </div>
      )}

      <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting} className="self-start">
        {t('createCollection')}
        {stagedItems.length > 0 && (
          <span className="ml-1.5 text-primary-foreground/70">({stagedItems.length})</span>
        )}
      </Button>
    </div>
  );
}
