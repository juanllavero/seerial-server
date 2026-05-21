import { getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useSearchLibrary } from '@seerial/api';
import { type LibrarySearchItem, type LibrarySearchItemType, LibraryTypes } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  NavigationButton,
  NavigationContainer,
  NavigationScrollView,
} from '@/shared/components/navigation';
import Page from '@/shared/components/page';
import ListTitle from '@/shared/components/text/list-title';
import ContentCard from '@/shared/components/ui/content-card';
import FlexBox from '@/shared/components/ui/flex-box';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

const RESULT_GROUP_ORDER: LibrarySearchItemType[] = [
  'collection',
  'movie',
  'series',
  'album',
  'artist',
  'episode',
  'song',
];

const RESULT_GROUP_LABELS: Record<LibrarySearchItemType, string> = {
  collection: 'Collections',
  movie: 'Movies',
  series: 'Series',
  album: 'Albums',
  artist: 'Artists',
  episode: 'Episodes',
  song: 'Songs',
};

const KEYBOARD_LAYOUT = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
  ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0'],
  ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  ['SPACE', 'BACKSPACE', 'CLEAR'],
] as const;

function getResultFocusKey(item: LibrarySearchItem): string {
  return `search-result-${item.type}-${item.id}`;
}

interface SearchInputPanelProps {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  suggestions: string[];
  firstResultFocusKey?: string;
  lastLeftPanelFocusKeyRef: { current: string };
}

function SearchInputPanel({
  query,
  setQuery,
  suggestions,
  firstResultFocusKey,
  lastLeftPanelFocusKeyRef,
}: SearchInputPanelProps) {
  const handleKeyboardKeyPress = (key: (typeof KEYBOARD_LAYOUT)[number][number]) => {
    if (key === 'SPACE') {
      setQuery((prev) => `${prev} `);
      return;
    }

    if (key === 'BACKSPACE') {
      setQuery((prev) => prev.slice(0, -1));
      return;
    }

    if (key === 'CLEAR') {
      setQuery('');
      return;
    }

    setQuery((prev) => `${prev}${key}`);
  };

  const handleLeftPanelArrowPress = (direction: string) => {
    if (direction === 'right' && firstResultFocusKey) {
      setFocus(firstResultFocusKey);
      return false;
    }

    return true;
  };

  const handleKeyboardArrowPress = (direction: string, isRightmostColumn: boolean) => {
    if (direction === 'right' && isRightmostColumn && firstResultFocusKey) {
      setFocus(firstResultFocusKey);
      return false;
    }

    return true;
  };

  return (
    <FlexBox
      direction="column"
      width="30dvw"
      height="100%"
      gap={1.2}
      className="rounded-2xl border border-white/20 bg-black/35 p-[2dvh]"
    >
      <ListTitle className="text-[2.2dvh]! pl-0!">Search</ListTitle>
      <input
        className="h-[6dvh] w-full rounded-xl border border-white/30 bg-black/50 px-4 text-[2.2dvh] text-white outline-none"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Type to search"
        spellCheck={false}
      />

      <div className="flex max-h-[50%] flex-col gap-2 overflow-y-auto pr-[0.4dvh]">
        {KEYBOARD_LAYOUT.map((row) => (
          <div
            key={`search-key-row-${row.join('-')}`}
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
          >
            {row.map((key, columnIndex) => {
              const isRightmostColumn = columnIndex === row.length - 1;

              return (
                <NavigationButton
                  key={key}
                  customKey={`search-key-${key}`}
                  text={key === 'BACKSPACE' ? 'Backspace' : key === 'SPACE' ? 'Space' : key}
                  variant="secondary"
                  className="h-[4.5dvh] justify-center"
                  onFocus={() => {
                    lastLeftPanelFocusKeyRef.current = `search-key-${key}`;
                  }}
                  onArrowPress={(direction) =>
                    handleKeyboardArrowPress(direction, isRightmostColumn)
                  }
                  onClick={() => handleKeyboardKeyPress(key)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {!!suggestions.length && (
        <>
          <ListTitle className="text-[1.9dvh]! pt-[0.5dvh]! pl-0!">Suggestions</ListTitle>
          <NavigationScrollView
            direction="vertical"
            className="gap-2 pr-[0.5dvh] w-[25dvw]"
            scrollMode="center"
            isRestoringFocus={false}
          >
            {suggestions.map((suggestion) => (
              <NavigationButton
                key={suggestion}
                customKey={`search-suggestion-${suggestion}`}
                text={suggestion}
                variant="secondary"
                className="justify-start"
                onFocus={() => {
                  lastLeftPanelFocusKeyRef.current = `search-suggestion-${suggestion}`;
                }}
                onArrowPress={handleLeftPanelArrowPress}
                onClick={() => setQuery(suggestion)}
              />
            ))}
          </NavigationScrollView>
        </>
      )}
    </FlexBox>
  );
}

interface SearchResultsPanelProps {
  query: string;
  allResults: LibrarySearchItem[];
  groupedResults: Partial<Record<LibrarySearchItemType, LibrarySearchItem[]>>;
  focusedResultId?: string;
  setFocusedResultId: React.Dispatch<React.SetStateAction<string | undefined>>;
  lastLeftPanelFocusKeyRef: { current: string };
  onNavigateToResult: (item: LibrarySearchItem) => void;
}

function SearchResultsPanel({
  query,
  allResults,
  groupedResults,
  focusedResultId,
  setFocusedResultId,
  lastLeftPanelFocusKeyRef,
  onNavigateToResult,
}: SearchResultsPanelProps) {
  return (
    <FlexBox direction="column" width="80dvw" height="100%" gap={1} className="min-w-0">
      <ListTitle className="text-[2.2dvh]! pl-0!">Results</ListTitle>
      {!query.trim().length && (
        <div className="text-[2dvh] text-white/70">Start typing with the keyboard to search.</div>
      )}
      {!!query.trim().length && !allResults.length && (
        <div className="text-[2dvh] text-white/70">No results found for the current query.</div>
      )}

      <NavigationScrollView
        direction="vertical"
        className="h-full gap-[1.2dvh] pr-[0.6dvh]"
        scrollMode="center"
        focusedElementId={focusedResultId}
        isRestoringFocus={false}
      >
        {RESULT_GROUP_ORDER.map((type) => {
          const items = groupedResults[type];

          if (!items?.length) {
            return null;
          }

          return (
            <div key={type} className="mb-[1.2dvh]">
              <ListTitle className="text-[1.8dvh]! pb-[0.6dvh]! pl-0!">
                {RESULT_GROUP_LABELS[type]}
              </ListTitle>
              <NavigationScrollView
                direction="horizontal"
                className="gap-4 pb-[0.5dvh]"
                scrollMode="center"
                focusedElementId={focusedResultId}
                isRestoringFocus={false}
              >
                {items.map((item) => {
                  const focusKey = getResultFocusKey(item);
                  const isFirstItemInGroup = items[0]?.id === item.id;

                  return (
                    <ContentCard
                      key={focusKey}
                      customKey={focusKey}
                      imgSrc={item.imageSrc ?? ''}
                      title={item.title}
                      subtitle={item.subtitle}
                      width="13dvw"
                      aspectRatio={
                        item.type === 'album' || item.type === 'artist' || item.type === 'song'
                          ? '1'
                          : '2/3'
                      }
                      action={() => onNavigateToResult(item)}
                      onFocus={() => setFocusedResultId(focusKey)}
                      onArrowPress={(direction) => {
                        if (direction === 'left' && isFirstItemInGroup) {
                          setFocus(lastLeftPanelFocusKeyRef.current);
                          return false;
                        }

                        return true;
                      }}
                    />
                  );
                })}
              </NavigationScrollView>
            </div>
          );
        })}
      </NavigationScrollView>
    </FlexBox>
  );
}

function SearchPage() {
  const navigate = useNavigate();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const [query, setQuery] = useState('');
  const [focusedResultId, setFocusedResultId] = useState<string | undefined>(undefined);
  const lastLeftPanelFocusKeyRef = useRef('search-key-A');

  const { data: searchResults = [] } = useSearchLibrary<LibrarySearchItem[]>(query, {
    enabled: serverUrl !== '' && query.trim().length > 0,
    params: { limit: 12 },
    staleTime: 5_000,
  });

  const groupedResults = useMemo(() => {
    const entries = RESULT_GROUP_ORDER.flatMap((type) => {
      const items = searchResults.filter((result) => result.type === type);
      return items.length > 0
        ? ([[type, items]] as [LibrarySearchItemType, LibrarySearchItem[]][])
        : [];
    });

    return Object.fromEntries(entries) as Partial<
      Record<LibrarySearchItemType, LibrarySearchItem[]>
    >;
  }, [searchResults]);

  const allResults = useMemo(
    () => RESULT_GROUP_ORDER.flatMap((type) => groupedResults[type] ?? []),
    [groupedResults],
  );
  const firstResultFocusKey = allResults[0] ? getResultFocusKey(allResults[0]) : undefined;

  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length < 2) {
      return [];
    }

    const seen = new Set<string>();
    const filteredTitles: string[] = [];
    for (const item of searchResults) {
      const title = item.title.trim();
      if (title.length > 0 && !seen.has(title)) {
        seen.add(title);
        if (title.toLowerCase().includes(normalizedQuery)) {
          filteredTitles.push(title);
        }
      }
    }

    filteredTitles.sort((a, b) => {
      const startsA = a.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
      const startsB = b.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
      if (startsA !== startsB) {
        return startsA - startsB;
      }
      return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });

    return filteredTitles.slice(0, 6);
  }, [query, searchResults]);

  const handleNavigateToResult = (item: LibrarySearchItem) => {
    const detailsType = item.navigation.detailsType;
    const detailsId = item.navigation.detailsId;

    if (!detailsId) {
      return;
    }

    if (detailsType === 'collection') {
      navigate(`/details/collection/${detailsId}/${item.libraryType ?? LibraryTypes.MOVIES}`);
      return;
    }

    navigate(`/details/${detailsType}/${detailsId}`, {
      state: {
        currentSeasonNumber: item.navigation.currentSeasonNumber,
        focusEpisodeId: item.type === 'episode' ? item.navigation.focusItemId : undefined,
        focusSongId: item.type === 'song' ? item.navigation.focusItemId : undefined,
      },
    });
  };

  useKeyboardBack({
    navigateOnBack: false,
    preAction: () => {
      const currentFocusKey = getCurrentFocusKey() ?? '';
      const isSearchFocus = currentFocusKey.startsWith('search-');

      if (isSearchFocus) {
        setFocus(NavigationFocusKeys.topBar.container);
        return;
      }

      navigate('/home');
    },
  });

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => {
      if (!query) {
        setFocus('search-key-A');
      }
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [query]);

  return (
    <Page padding="2dvh 4dvh 3dvh 4dvh" fullScreen>
      <NavigationContainer className="h-full w-full" customFocusKey="search-page-container">
        <FlexBox width="100%" height="100%" gap={2.5} className="pr-[2dvh]">
          <SearchInputPanel
            query={query}
            setQuery={setQuery}
            suggestions={suggestions}
            firstResultFocusKey={firstResultFocusKey}
            lastLeftPanelFocusKeyRef={lastLeftPanelFocusKeyRef}
          />

          <SearchResultsPanel
            query={query}
            allResults={allResults}
            groupedResults={groupedResults}
            focusedResultId={focusedResultId}
            setFocusedResultId={setFocusedResultId}
            lastLeftPanelFocusKeyRef={lastLeftPanelFocusKeyRef}
            onNavigateToResult={handleNavigateToResult}
          />
        </FlexBox>
      </NavigationContainer>
    </Page>
  );
}

export default memo(SearchPage);
