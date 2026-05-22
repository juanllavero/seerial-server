import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetCollection, useGetCollectionContent } from '@seerial/api';
import {
  type Collection,
  type ItemType,
  type LibraryItem,
  type LibraryType,
  LibraryTypes,
} from '@seerial/domain';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { NavigationScrollView } from '@/shared/components/navigation';
import { ListTitle } from '@/shared/components/text';
import ContentCard from '@/shared/components/ui/content-card';
import FlexBox from '@/shared/components/ui/flex-box';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import RelatedSongsSection from './related-songs-section';

interface CollectionContentData {
  movies: LibraryItem[];
  series: LibraryItem[];
  albums: LibraryItem[];
}

type ContentSectionKey = 'movies' | 'shows' | 'albums';

interface ContentSection {
  key: ContentSectionKey;
  title: string;
  items: LibraryItem[];
  itemType: ItemType;
  aspectRatio: string;
}

function getSectionTitle(
  key: ContentSectionKey,
  isCurrentType: boolean,
  t: (key: string) => string,
): string {
  if (!isCurrentType) {
    const titleMap: Record<ContentSectionKey, string> = {
      movies: t('movies'),
      shows: t('shows'),
      albums: t('albums'),
    };
    return titleMap[key];
  }

  const moreTitleMap: Record<ContentSectionKey, string> = {
    movies: t('moreMoviesInCollection'),
    shows: t('moreShowsInCollection'),
    albums: t('moreAlbumsInCollection'),
  };
  return moreTitleMap[key];
}

function getItemTypeForLibrary(libraryType: LibraryType | undefined): ItemType | undefined {
  switch (libraryType) {
    case LibraryTypes.MOVIES:
      return 'movie';
    case LibraryTypes.SHOWS:
      return 'series';
    case LibraryTypes.MUSIC:
      return 'album';
    default:
      return undefined;
  }
}

function getFirstRelatedSongFocusId(
  albums: Collection['albums'] | undefined,
  songs: Collection['songs'] | undefined,
) {
  if (!albums?.length || !songs?.length) {
    return undefined;
  }

  const albumIds = new Set(albums.map((album) => album.id));
  const firstSongWithAlbum = songs.find((song) => albumIds.has(song.albumId));

  return firstSongWithAlbum ? `related-song-${firstSongWithAlbum.id}` : undefined;
}

interface RelatedContentPageProps {
  collectionId: string;
  currentItemId?: string;
  currentItemType?: ItemType;
  libraryType?: LibraryType;
  isVisible: boolean;
  onNavigateBack: () => void;
}

function RelatedContentPage({
  collectionId,
  currentItemId,
  currentItemType,
  libraryType,
  isVisible,
  onNavigateBack,
}: RelatedContentPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [focusedElementId, setFocusedElementId] = useState<string | undefined>();
  const hasFocusedRef = useRef(false);
  const lastFocusedSongIdRef = useRef<string | undefined>(undefined);

  useKeyboardBack({
    enabled: isVisible,
    navigateOnBack: false,
    preAction: onNavigateBack,
    capture: true,
    stopPropagation: true,
  });

  const { data: collection } = useGetCollection<Collection>(collectionId, {
    enabled: !!collectionId,
  });

  const { data: collectionContent } = useGetCollectionContent<CollectionContentData>(collectionId, {
    enabled: !!collectionId,
  });

  const handleLeftFromSongs = useCallback(
    (direction: string) => {
      if (direction === 'left') {
        onNavigateBack();
        return false;
      }
      return true;
    },
    [onNavigateBack],
  );

  const currentItemTypeFromLibrary = getItemTypeForLibrary(libraryType);

  const sections = useMemo<ContentSection[]>(() => {
    if (!collectionContent) return [];

    const allSections: ContentSection[] = [
      {
        key: 'movies',
        title: getSectionTitle(
          'movies',
          currentItemType === 'movie' || currentItemTypeFromLibrary === 'movie',
          t,
        ),
        items: collectionContent.movies,
        itemType: 'movie',
        aspectRatio: '2/3',
      },
      {
        key: 'shows',
        title: getSectionTitle(
          'shows',
          currentItemType === 'series' || currentItemTypeFromLibrary === 'series',
          t,
        ),
        items: collectionContent.series,
        itemType: 'series',
        aspectRatio: '2/3',
      },
      {
        key: 'albums',
        title: getSectionTitle(
          'albums',
          currentItemType === 'album' || currentItemTypeFromLibrary === 'album',
          t,
        ),
        items: collectionContent.albums,
        itemType: 'album',
        aspectRatio: '1',
      },
    ];

    return allSections.reduce<ContentSection[]>((acc, section) => {
      const newSection = {
        ...section,
        items:
          currentItemId && section.itemType === currentItemType
            ? section.items.filter((item) => item.id !== currentItemId)
            : section.items,
      };
      if (newSection.items.length > 0) {
        acc.push(newSection);
      }
      return acc;
    }, []);
  }, [collectionContent, currentItemId, currentItemType, currentItemTypeFromLibrary, t]);

  const albums = collection?.albums ?? [];
  const collectionSongs = collection?.songs ?? [];
  const firstSongFocusId = useMemo(
    () => getFirstRelatedSongFocusId(collection?.albums, collection?.songs),
    [collection?.albums, collection?.songs],
  );

  const handleLeftFromRelatedContent = useCallback(
    (direction: string) => {
      if (direction !== 'left') {
        return true;
      }

      const songFocusId = lastFocusedSongIdRef.current ?? firstSongFocusId;
      if (songFocusId) {
        setFocusedElementId(songFocusId);
        setFocus(songFocusId);
        return false;
      }

      onNavigateBack();
      return false;
    },
    [firstSongFocusId, onNavigateBack],
  );

  // Reset focus guard when the page is hidden so it re-focuses on next open
  useEffect(() => {
    if (!isVisible) {
      hasFocusedRef.current = false;
    }
  }, [isVisible]);

  // Focus the first element when the page becomes visible
  useEffect(() => {
    if (!isVisible || hasFocusedRef.current) return;

    const firstSection = sections[0];
    const firstItem = firstSection?.items[0];
    const focusId =
      firstSongFocusId ?? (firstItem ? `related-${firstSection.key}-${firstItem.id}` : undefined);
    if (!focusId) return;

    hasFocusedRef.current = true;
    setFocusedElementId(focusId);

    const frame = window.requestAnimationFrame(() => {
      setFocus(focusId);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [firstSongFocusId, isVisible, sections]);

  return (
    <FlexBox
      direction="row"
      width="100dvw"
      height="100dvh"
      padding="4dvh 0 2dvh 0"
      gap={2}
      className="overflow-hidden"
    >
      {collectionSongs.length > 0 && (
        <RelatedSongsSection
          albums={albums}
          songs={collectionSongs}
          focusedElementId={focusedElementId}
          onSongFocus={(id) => {
            const songFocusId = `related-song-${id}`;
            lastFocusedSongIdRef.current = songFocusId;
            setFocusedElementId(songFocusId);
          }}
          onArrowPress={handleLeftFromSongs}
        />
      )}
      <NavigationScrollView
        direction="vertical"
        className="w-full max-h-full gap-6 pb-[5dvh]"
        scrollMode="center"
        focusedElementId={focusedElementId}
        isRestoringFocus={false}
      >
        {sections.map((section) => (
          <FlexBox
            key={section.key}
            direction="column"
            gap={1.5}
            width="100%"
            css={{ minWidth: 0 }}
          >
            <ListTitle>{section.title}</ListTitle>

            <NavigationScrollView
              direction="horizontal"
              className="z-10 w-full min-w-0 gap-5"
              scrollMode="center"
              focusedElementId={focusedElementId}
              isRestoringFocus={false}
            >
              {section.items.map((item, itemIndex) => (
                <ContentCard
                  key={item.id}
                  customKey={`related-${section.key}-${item.id}`}
                  title={item.title}
                  subtitle={item.years}
                  imgSrc={item.coverSrc ?? ''}
                  width="25vh"
                  aspectRatio={section.aspectRatio}
                  onFocus={() => {
                    setFocusedElementId(`related-${section.key}-${item.id}`);
                  }}
                  onArrowPress={itemIndex === 0 ? handleLeftFromRelatedContent : undefined}
                  action={() => {
                    navigate(`/details/${section.itemType}/${item.id}`, {
                      state: {
                        cachedDetails: item.details,
                        collectionId,
                        libraryType,
                      },
                    });
                  }}
                />
              ))}
            </NavigationScrollView>
          </FlexBox>
        ))}
      </NavigationScrollView>
    </FlexBox>
  );
}

export default memo(RelatedContentPage);
