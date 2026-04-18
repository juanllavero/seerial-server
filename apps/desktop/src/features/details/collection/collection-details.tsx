import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetCollectionContent } from '@seerial/api';
import {
  type Collection,
  type DetailsData,
  type LibraryItem,
  type LibraryType,
  LibraryTypes,
} from '@seerial/domain';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import BackgroundImage from '@/components/backgrounds/BackgroundImage';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import NavigationScrollView from '@/components/navigation/NavigationScrollView';
import ListTitle from '@/components/text/ListTitle';
import Subtitle from '@/components/text/Subtitle';
import Tertiary from '@/components/text/Tertiary';
import FlexBox from '@/components/ui/FlexBox';
import Image from '@/components/ui/Image';
import { useSettingsStore } from '@/features/settings/stores/settings.store';
import Page from '@/shared/components/page';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import ContentCard from '@/shared/ui/card';

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

function getOrderedSectionKeys(libraryType: LibraryType | undefined): CollectionSectionKey[] {
  switch (libraryType) {
    case 'Movies':
      return ['movies', 'shows', 'albums'];
    case 'Music':
      return ['albums', 'shows', 'movies'];
    default:
      return ['shows', 'movies', 'albums'];
  }
}

interface CollectionDetailsProps {
  collectionId: string;
  collection: Collection | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
  libraryType: LibraryType | undefined;
}

function CollectionDetails({
  collectionId,
  collection,
  isLoading,
  details,
  libraryType,
}: CollectionDetailsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [focusedElementId, setFocusedElementId] = useState<string>();
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

  // Split albums into singles and normal albums if libraryType is MUSIC
  let singles: LibraryItem[] = [];
  let normalAlbums: LibraryItem[] = [];
  if (libraryType === LibraryTypes.MUSIC && collectionContent?.albums) {
    singles = collectionContent.albums.filter((album) => {
      const title = typeof album.title === 'string' ? album.title.toLowerCase() : '';
      const isSingleTitle = title.includes('single') || title.includes('sigle');
      const isShort = album.numberOfItems < 4;
      return isSingleTitle || isShort;
    });
    normalAlbums = collectionContent.albums.filter((album) => {
      const title = typeof album.title === 'string' ? album.title.toLowerCase() : '';
      const isSingleTitle = title.includes('single') || title.includes('sigle');
      const isShort = album.numberOfItems < 4;
      return !(isSingleTitle || isShort);
    });
  }

  const sectionsByKey: Record<CollectionSectionKey, CollectionSection> = {
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
      items:
        libraryType === LibraryTypes.MUSIC
          ? normalAlbums
          : collectionContent?.albums ?? [],
      itemType: 'album',
      aspectRatio: '1',
    },
  };

  // Add a section for singles if music library
  const orderedSections: CollectionSection[] = (() => {
    if (libraryType === LibraryTypes.MUSIC) {
      // Always show singles first, then albums, then the rest
      const singlesSection: CollectionSection = {
        key: 'albums',
        title: t('singles'),
        items: singles,
        itemType: 'album',
        aspectRatio: '1',
      };
      // Only include section if there are singles
      return [
        ...(singles.length > 0 ? [singlesSection] : []),
        ...getOrderedSectionKeys(libraryType)
          .map((key) => sectionsByKey[key])
          .filter((section) => section.items.length > 0),
      ];
    } else {
      return getOrderedSectionKeys(libraryType)
        .map((key) => sectionsByKey[key])
        .filter((section) => section.items.length > 0);
    }
  })();

  // (moved above, see new logic for orderedSections)

  const firstFocusedElementId = (() => {
    const firstSection = orderedSections[0];
    const firstItem = firstSection?.items[0];

    if (!firstSection || !firstItem) {
      return undefined;
    }

    return `${firstSection.key}-${firstItem.id}`;
  })();

  useEffect(() => {
    if (!firstFocusedElementId) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      setFocusedElementId(firstFocusedElementId);
      setFocus(firstFocusedElementId);
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [firstFocusedElementId]);

  const imageWidth = libraryType === LibraryTypes.MUSIC ? '45vh' : '45vh';
  const imageHeight = libraryType === LibraryTypes.MUSIC ? '45vh' : '68vh';

  if (!isLoading && !collection) return <span>Collection not found</span>;

  return (
    <Page justify="end" padding="3rem 0 3rem 4rem">
      <GradientBackground
        imageSrc={details?.coverSrc ?? collection?.coverSrc ?? collection?.backgroundSrc}
        index={0}
      />
      <BackgroundImage
        imageSrc={details?.backgroundSrc ?? collection?.backgroundSrc ?? collection?.coverSrc}
        index={0}
      />

      <FlexBox
        gap={4}
        align="end"
        width="100%"
        height="100%"
        className="z-10 px-8 pb-8"
        css={{ minWidth: 0 }}
      >
        <FlexBox direction="column" align="center" gap={2} width={'50vh'} height={'100%'}>
          <Image
            url={details?.coverSrc ?? collection?.coverSrc ?? ''}
            width={imageWidth}
            height={imageHeight}
            className={cardRoundness}
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
          className="h-[60vh] w-full min-w-0 flex-1 gap-6 pb-4 pr-2"
          scrollMode="center"
          focusedElementId={focusedElementId}
          isRestoringFocus={false}
        >
          {orderedSections.map((section) => (
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
                className="z-10 w-full min-w-0 gap-5 pb-2"
                scrollMode="center"
                focusedElementId={focusedElementId}
                isRestoringFocus={false}
              >
                {section.items.map((item) => (
                  <ContentCard
                    key={item.id}
                    customKey={`${section.key}-${item.id}`}
                    title={item.title}
                    subtitle={item.years}
                    imgSrc={item.coverSrc ?? ''}
                    width={'25vh'}
                    aspectRatio={section.aspectRatio}
                    onFocus={() => {
                      setFocusedElementId(`${section.key}-${item.id}`);
                    }}
                    action={() => {
                      navigate(`/details/${section.itemType}/${item.id}`, {
                        state: { cachedDetails: item.details },
                      });
                    }}
                  />
                ))}
              </NavigationScrollView>
            </FlexBox>
          ))}
        </NavigationScrollView>
      </FlexBox>
    </Page>
  );
}

export default memo(CollectionDetails);
