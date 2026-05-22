import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetCollectionContent, useGetCollectionMusicExtras } from '@seerial/api';
import {
  type Collection,
  type DetailsData,
  type LibraryItem,
  type LibraryType,
  LibraryTypes,
} from '@seerial/domain';
import { useDataStore, useGradientStore } from '@seerial/stores';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import { DetailsWithRelatedContent, useRelatedContent } from '@/features/details/shared';
import BackgroundImage from '@/shared/components/backgrounds/background-image';
import { NavigationScrollView } from '@/shared/components/navigation';
import Page from '@/shared/components/page';
import { ListTitle, Subtitle, Tertiary } from '@/shared/components/text';
import CollageImage from '@/shared/components/ui/collage-image';
import ContentCard from '@/shared/components/ui/content-card';
import FlexBox from '@/shared/components/ui/flex-box';
import Image from '@/shared/components/ui/image';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import { useSettingsStore } from '@/shared/stores';
import MusicExtraCard from './music-extra-card';

interface MusicExtra {
  title: string;
  src: string;
  type: string;
}

type CollectionSectionKey = 'albums' | 'movies' | 'shows';

interface CollectionSection {
  key: CollectionSectionKey;
  title: string;
  items: LibraryItem[];
  itemType: 'album' | 'movie' | 'series';
  aspectRatio: string;
}

interface CollectionContentData {
  movies: LibraryItem[];
  series: LibraryItem[];
  albums: LibraryItem[];
}

function isSingleAlbum(album: LibraryItem): boolean {
  const title = typeof album.title === 'string' ? album.title.toLowerCase() : '';
  const isSingleTitle = title.includes('single') || title.includes('sigle');
  const isShort = album.numberOfItems < 4;
  return isSingleTitle || isShort;
}

function splitCollectionAlbums(
  libraryType: LibraryType | undefined,
  content: CollectionContentData | undefined,
): { singles: LibraryItem[]; normalAlbums: LibraryItem[] } {
  if (libraryType !== LibraryTypes.MUSIC || !content?.albums) {
    return { singles: [], normalAlbums: [] };
  }

  return {
    singles: content.albums.filter((album) => isSingleAlbum(album)),
    normalAlbums: content.albums.filter((album) => !isSingleAlbum(album)),
  };
}

function buildSectionsByKey(
  t: (key: string) => string,
  collectionContent: CollectionContentData | undefined,
  libraryType: LibraryType | undefined,
  normalAlbums: LibraryItem[],
): Record<CollectionSectionKey, CollectionSection> {
  return {
    shows: {
      key: 'shows',
      title: t('shows'),
      items: collectionContent?.series ?? [],
      itemType: 'series',
      aspectRatio: '2/3',
    },
    movies: {
      key: 'movies',
      title: t('movies'),
      items: collectionContent?.movies ?? [],
      itemType: 'movie',
      aspectRatio: '2/3',
    },
    albums: {
      key: 'albums',
      title: t('albums'),
      items: libraryType === LibraryTypes.MUSIC ? normalAlbums : (collectionContent?.albums ?? []),
      itemType: 'album',
      aspectRatio: '1',
    },
  };
}

function buildOrderedSections(
  libraryType: LibraryType | undefined,
  sectionsByKey: Record<CollectionSectionKey, CollectionSection>,
  singles: LibraryItem[],
  t: (key: string) => string,
): CollectionSection[] {
  const orderedSections = getOrderedSectionKeys(libraryType).reduce<CollectionSection[]>(
    (acc, key) => {
      const section = sectionsByKey[key];
      if (section.items.length > 0) {
        acc.push(section);
      }
      return acc;
    },
    [],
  );

  if (libraryType !== LibraryTypes.MUSIC || singles.length === 0) {
    return orderedSections;
  }

  return [
    {
      key: 'albums',
      title: t('singles'),
      items: singles,
      itemType: 'album',
      aspectRatio: '1',
    },
    ...orderedSections,
  ];
}

function getFirstFocusedElementId(
  sections: CollectionSection[],
  musicExtras?: MusicExtra[],
): string | undefined {
  const firstSection = sections[0];
  const firstItem = firstSection?.items[0];

  if (firstSection && firstItem) {
    return `${firstSection.key}-${firstItem.id}`;
  }

  if (musicExtras && musicExtras.length > 0) {
    return 'extra-0';
  }

  return undefined;
}

function getOrderedSectionKeys(libraryType: LibraryType | undefined): CollectionSectionKey[] {
  switch (libraryType) {
    case 'Movies':
      return ['movies'];
    case 'Music':
      return ['albums'];
    case 'Shows':
      return ['shows'];
    default:
      return ['shows', 'movies', 'albums'];
  }
}

interface CollectionCoverProps {
  collageImages: string[] | undefined;
  coverSrc: string;
  imageWidth: string;
  imageHeight: string;
  cardRoundness: string;
  libraryType: LibraryType | undefined;
}

function CollectionCover({
  collageImages,
  coverSrc,
  imageWidth,
  imageHeight,
  cardRoundness,
  libraryType,
}: CollectionCoverProps) {
  if (collageImages && collageImages.length > 1) {
    return (
      <div
        style={{ width: imageWidth, height: imageHeight }}
        className={`overflow-hidden ${cardRoundness}`}
      >
        <CollageImage
          images={collageImages}
          defaultSrc={
            libraryType === LibraryTypes.MUSIC ? '/img/songDefault.png' : '/img/fileNotFound.jpg'
          }
          className={cardRoundness}
        />
      </div>
    );
  }

  const singleSrc = collageImages && collageImages.length === 1 ? collageImages[0] : coverSrc;

  return (
    <Image url={singleSrc} width={imageWidth} height={imageHeight} className={cardRoundness} />
  );
}

function buildContentCardArrowHandler(
  isFirstSection: boolean,
  isLastItem: boolean,
  hasRelatedContent: boolean,
  navigateToRelated: () => void,
): ((direction: string) => boolean) | undefined {
  if (!isFirstSection && !(isLastItem && hasRelatedContent)) {
    return undefined;
  }
  return (direction: string) => {
    if (isFirstSection && direction === 'up') {
      setFocus(NavigationFocusKeys.topBar.container);
      return false;
    }
    if (isLastItem && hasRelatedContent && direction === 'right') {
      navigateToRelated();
      return false;
    }
    return true;
  };
}

interface CollectionDetailsProps {
  collectionId: string;
  collection: Collection | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
  libraryType: LibraryType | undefined;
  /** Up to 4 cover paths for collage rendering, forwarded from the library grid. */
  collageImages?: string[];
}

function CollectionDetails({
  collectionId,
  collection,
  isLoading,
  details,
  libraryType,
  collageImages,
}: CollectionDetailsProps) {
  return (
    <DetailsWithRelatedContent
      collectionId={collectionId}
      libraryType={libraryType}
      background={
        <BackgroundImage
          imageSrc={details?.backgroundSrc ?? collection?.backgroundSrc ?? collection?.coverSrc}
          index={0}
        />
      }
    >
      <CollectionDetailsContent
        collectionId={collectionId}
        collection={collection}
        isLoading={isLoading}
        details={details}
        libraryType={libraryType}
        collageImages={collageImages}
      />
    </DetailsWithRelatedContent>
  );
}

function CollectionDetailsContent({
  collectionId,
  collection,
  isLoading,
  details,
  libraryType,
  collageImages,
}: CollectionDetailsProps) {
  const { navigateToRelated, hasRelatedContent } = useRelatedContent();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setGradientImageSrc = useGradientStore((state) => state.setGradientImageSrc);
  const { lastFocusedElementId, setLastFocusedElementId } = useDataStore(
    (s) => ({
      lastFocusedElementId: s.lastFocusedElementId,
      setLastFocusedElementId: s.setLastFocusedElementId,
    }),
    shallow,
  );
  const { cardRoundness } = useSettingsStore(
    (s) => ({
      cardRoundness: s.settings.cardRoundness,
    }),
    shallow,
  );
  useKeyboardBack();

  const { data: collectionContent } = useGetCollectionContent<CollectionContentData>(collectionId, {
    enabled: !!collectionId,
  });

  const { data: musicExtras } = useGetCollectionMusicExtras<MusicExtra[]>(collectionId, {
    enabled: !!collectionId && libraryType === LibraryTypes.MUSIC,
  });

  const { singles, normalAlbums } = useMemo(
    () => splitCollectionAlbums(libraryType, collectionContent),
    [libraryType, collectionContent],
  );

  const sectionsByKey = useMemo(
    () => buildSectionsByKey(t, collectionContent, libraryType, normalAlbums),
    [t, collectionContent, libraryType, normalAlbums],
  );

  const orderedSections = useMemo(
    () => buildOrderedSections(libraryType, sectionsByKey, singles, t),
    [libraryType, sectionsByKey, singles, t],
  );

  const firstFocusedElementId = useMemo(
    () => getFirstFocusedElementId(orderedSections, musicExtras),
    [orderedSections, musicExtras],
  );

  const allPageItemIds = useMemo(() => {
    const ids = new Set<string>();
    for (const section of orderedSections) {
      for (const item of section.items) {
        ids.add(`${section.key}-${item.id}`);
      }
    }
    musicExtras?.forEach((_, i) => {
      ids.add(`extra-${i}`);
    });
    return ids;
  }, [orderedSections, musicExtras]);

  const isRestoringFocus = !!lastFocusedElementId && allPageItemIds.has(lastFocusedElementId);

  const hasFocusedRef = useRef(false);
  const lastFocusTargetKeyRef = useRef<string | null>(null);

  const isScrollRestoring = isRestoringFocus && !hasFocusedRef.current;

  useEffect(() => {
    if (!firstFocusedElementId) {
      return;
    }

    const idToFocus =
      isRestoringFocus && lastFocusedElementId ? lastFocusedElementId : firstFocusedElementId;
    const focusTargetKey = `${collectionId ?? ''}:${idToFocus}`;

    if (lastFocusTargetKeyRef.current !== focusTargetKey) {
      lastFocusTargetKeyRef.current = focusTargetKey;
      hasFocusedRef.current = false;
    }

    if (hasFocusedRef.current) {
      return;
    }

    setLastFocusedElementId(idToFocus);

    let focusRetryTimer: number | null = null;
    let focusAttempts = 0;
    const maxFocusAttempts = 12;

    const focusWhenReady = () => {
      const focusableTarget = document.querySelector(`[data-focus-key="${idToFocus}"]`);
      if (focusableTarget) {
        hasFocusedRef.current = true;
        setFocus(idToFocus);
        return;
      }

      focusAttempts += 1;
      if (focusAttempts < maxFocusAttempts) {
        focusRetryTimer = window.setTimeout(focusWhenReady, 40);
      }
    };

    const focusFrame = window.requestAnimationFrame(focusWhenReady);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      if (focusRetryTimer !== null) {
        window.clearTimeout(focusRetryTimer);
      }
    };
  }, [
    collectionId,
    firstFocusedElementId,
    isRestoringFocus,
    lastFocusedElementId,
    setLastFocusedElementId,
  ]);

  const imageWidth = libraryType === LibraryTypes.MUSIC ? '45vh' : '45vh';
  const imageHeight = libraryType === LibraryTypes.MUSIC ? '45vh' : '68vh';

  useEffect(() => {
    const src =
      details?.coverSrc ||
      collection?.coverSrc ||
      collection?.backgroundSrc ||
      collageImages?.[0] ||
      '';
    setGradientImageSrc(src);
    return () => setGradientImageSrc('');
  }, [
    details?.coverSrc,
    collection?.coverSrc,
    collection?.backgroundSrc,
    collageImages,
    setGradientImageSrc,
  ]);

  if (!isLoading && !collection) return <span>Collection not found</span>;

  return (
    <Page direction="row" align="end" justify="end" padding="0" gap={0} fullScreen>
      <FlexBox
        direction="column"
        align="center"
        justify="center"
        padding="2dvh 1dvh"
        gap={2}
        width={'30dvw'}
        height={'100%'}
        className="z-50"
      >
        <CollectionCover
          collageImages={collageImages}
          coverSrc={details?.coverSrc ?? collection?.coverSrc ?? ''}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          cardRoundness={cardRoundness}
          libraryType={libraryType}
        />

        <FlexBox direction="column" align="center">
          <Subtitle className="line-clamp-2 max-h-[8vh] leading-none text-center">
            {details?.title ?? collection?.title ?? ''}
          </Subtitle>
          <Tertiary>{details?.year ?? 'N/A'}</Tertiary>
        </FlexBox>
      </FlexBox>

      <NavigationScrollView
        direction="vertical"
        className="w-[70dvw] gap-6 max-h-screen pt-[10dvh] pb-[5dvh] z-50"
        scrollMode="center"
        focusedElementId={lastFocusedElementId}
        isRestoringFocus={isScrollRestoring}
      >
        {orderedSections.map((section, sectionIndex) => (
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
              focusedElementId={lastFocusedElementId}
              isRestoringFocus={isScrollRestoring}
            >
              {section.items.map((item, itemIndex) => {
                const isFirstSection = sectionIndex === 0;
                const isLastItem = itemIndex === section.items.length - 1;
                return (
                  <ContentCard
                    key={item.id}
                    customKey={`${section.key}-${item.id}`}
                    title={item.title}
                    subtitle={item.years}
                    imgSrc={
                      item.images && item.images.length === 1
                        ? item.images[0]
                        : (item.coverSrc ?? '')
                    }
                    collageImages={item.images && item.images.length > 1 ? item.images : undefined}
                    defaultImageSrc={
                      section.itemType === 'album'
                        ? '/img/songDefault.png'
                        : '/img/fileNotFound.jpg'
                    }
                    width={'25vh'}
                    aspectRatio={section.aspectRatio}
                    onFocus={() => {
                      setLastFocusedElementId(`${section.key}-${item.id}`);
                    }}
                    onArrowPress={buildContentCardArrowHandler(
                      isFirstSection,
                      isLastItem,
                      hasRelatedContent,
                      navigateToRelated,
                    )}
                    action={() => {
                      navigate(`/details/${section.itemType}/${item.id}`, {
                        state: {
                          cachedDetails: item.details,
                          collectionId,
                          libraryType,
                          collectionBackgroundSrc:
                            details?.backgroundSrc ??
                            collection?.backgroundSrc ??
                            collection?.coverSrc,
                        },
                      });
                    }}
                  />
                );
              })}
            </NavigationScrollView>
          </FlexBox>
        ))}

        {musicExtras && musicExtras.length > 0 && (
          <FlexBox direction="column" gap={1.5} width="100%" css={{ minWidth: 0 }}>
            <ListTitle>{t('extras')}</ListTitle>

            <NavigationScrollView
              direction="horizontal"
              className="z-10 w-full min-w-0 gap-5"
              scrollMode="center"
              focusedElementId={lastFocusedElementId}
              isRestoringFocus={isScrollRestoring}
            >
              {musicExtras.map((extra, index) => {
                const isLastExtra = index === musicExtras.length - 1;
                return (
                  <MusicExtraCard
                    key={`extra-${extra.src}`}
                    customKey={`extra-${index}`}
                    src={extra.src}
                    title={extra.title}
                    subtitle={extra.type}
                    width="30vh"
                    onFocus={() => setLastFocusedElementId(`extra-${index}`)}
                    onArrowPress={
                      isLastExtra && hasRelatedContent
                        ? (direction) => {
                            if (direction === 'right') {
                              navigateToRelated();
                              return false;
                            }
                            return true;
                          }
                        : undefined
                    }
                    action={() =>
                      navigate(
                        `/video-player/file?path=${encodeURIComponent(extra.src)}&title=${encodeURIComponent(`${collection?.title ? `${collection.title} - ` : ''}${extra.title}`)}`,
                      )
                    }
                  />
                );
              })}
            </NavigationScrollView>
          </FlexBox>
        )}
      </NavigationScrollView>
    </Page>
  );
}

export default memo(CollectionDetails);
