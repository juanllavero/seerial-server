import { useGetLibraryContent } from '@seerial/api';
import type { Library, LibraryItem, LibraryType } from '@seerial/domain';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui/input';

export interface StagedItem {
  id: string;
  title: string;
  libraryType: LibraryType;
}

interface MultiLibraryItemPickerProps {
  libraries: Library[];
  excludedIds?: string[];
  stagedItems: StagedItem[];
  onStagedItemsChange: (items: StagedItem[]) => void;
}

export function MultiLibraryItemPicker({
  libraries,
  excludedIds = [],
  stagedItems,
  onStagedItemsChange,
}: MultiLibraryItemPickerProps) {
  const { t } = useTranslation();
  const [activeLibraryId, setActiveLibraryId] = useState<string>(libraries[0]?.id ?? '');
  const [search, setSearch] = useState('');

  const activeLibrary = libraries.find((l) => l.id === activeLibraryId);

  const { data: libraryContent, isLoading } = useGetLibraryContent<LibraryItem[]>(activeLibraryId, {
    enabled: !!activeLibraryId,
    params: { type: activeLibrary?.type ?? '' },
    staleTime: 30000,
  });

  const stagedIds = new Set(stagedItems.map((s) => s.id));

  const availableItems = (libraryContent ?? [])
    .filter((item) => !excludedIds.includes(item.id))
    .filter((item) => !search || item.title.toLowerCase().includes(search.toLowerCase()));

  const toggle = (item: LibraryItem) => {
    if (!activeLibrary) return;
    if (stagedIds.has(item.id)) {
      onStagedItemsChange(stagedItems.filter((s) => s.id !== item.id));
    } else {
      onStagedItemsChange([
        ...stagedItems,
        { id: item.id, title: item.title, libraryType: activeLibrary.type },
      ]);
    }
  };

  const clearAll = () => onStagedItemsChange([]);

  if (libraries.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Library tabs */}
      <div className="flex flex-wrap gap-1.5">
        {libraries.map((lib) => {
          const countInLib = stagedItems.filter((s) => s.libraryType === lib.type).length;
          const isActive = lib.id === activeLibraryId;
          return (
            <button
              key={lib.id}
              type="button"
              onClick={() => {
                setActiveLibraryId(lib.id);
                setSearch('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground'
              }`}
            >
              {lib.name}
              {countInLib > 0 && (
                <span
                  className={`inline-flex items-center justify-center rounded-full size-4 text-[10px] font-bold ${
                    isActive
                      ? 'bg-primary-foreground/25 text-primary-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {countInLib}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search + item list */}
      {activeLibraryId && (
        <div className="flex flex-col gap-2">
          <Input
            placeholder={`${t('search')}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="border rounded-md overflow-hidden">
            {isLoading ? (
              <div className="p-3 text-sm text-muted-foreground">Loading...</div>
            ) : availableItems.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                {search ? t('noResults') : 'No items available'}
              </div>
            ) : (
              <ul className="max-h-48 overflow-y-auto divide-y divide-border/50">
                {availableItems.map((item) => {
                  const selected = stagedIds.has(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggle(item)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-muted/50 ${
                          selected ? 'bg-primary/10' : ''
                        }`}
                      >
                        <span
                          className={`shrink-0 size-4 rounded-sm border flex items-center justify-center transition-colors ${
                            selected ? 'bg-primary border-primary' : 'border-muted-foreground/50'
                          }`}
                        >
                          {selected && (
                            <svg
                              viewBox="0 0 10 8"
                              fill="none"
                              aria-hidden="true"
                              className="size-2.5 stroke-primary-foreground stroke-[2.5]"
                            >
                              <path d="M1 4l3 3 5-6" />
                            </svg>
                          )}
                        </span>
                        <span>{item.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Selection summary */}
      {stagedItems.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {stagedItems.length} {t('collectionItems').toLowerCase()} {t('itemsSelected')}
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="underline hover:text-foreground transition-colors"
          >
            {t('clearSelection')}
          </button>
        </div>
      )}
    </div>
  );
}
