import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import {
  type Album,
  type Collection,
  type DetailsData,
  type LibraryType,
  LibraryTypes,
  type Movie,
  type Series,
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

interface CollectionSection<TItem> {
  key: CollectionSectionKey;
  title: string;
  items: TItem[];
  itemType: 'album' | 'movie' | 'series';
  aspectRatio: string;
  getTitle: (item: TItem) => string;
  getSubtitle: (item: TItem) => string | undefined;
  getImageSrc: (item: TItem) => string;
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
  collection: Collection | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
  libraryType: LibraryType | undefined;
}

function CollectionDetails({
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

  const sectionsByKey: Record<CollectionSectionKey, CollectionSection<Album | Movie | Series>> = {
    shows: {
      key: 'shows',
      title: t('shows'),
      items: collection?.shows ?? [],
      itemType: 'series',
      aspectRatio: '2/3',
      getTitle: (item) => ('name' in item ? item.name : ''),
      getSubtitle: (item) => ('year' in item && item.year !== '' ? item.year : 'N/A'),
      getImageSrc: (item) => item.coverSrc ?? '',
    },
    movies: {
      key: 'movies',
      title: t('movies'),
      items: collection?.movies ?? [],
      itemType: 'movie',
      aspectRatio: '2/3',
      getTitle: (item) => ('name' in item ? item.name : ''),
      getSubtitle: (item) =>
        'year' in item && item.year !== '' ? item.year?.split('-')[0] : 'N/A',
      getImageSrc: (item) => item.coverSrc ?? '',
    },
    albums: {
      key: 'albums',
      title: t('albums'),
      items: collection?.albums ?? [],
      itemType: 'album',
      aspectRatio: '1',
      getTitle: (item) => ('title' in item ? item.title : ''),
      getSubtitle: (item) => ('year' in item && item.year !== '' ? item.year : 'N/A'),
      getImageSrc: (item) => item.coverSrc ?? '',
    },
  };

  const orderedSections = getOrderedSectionKeys(libraryType)
    .map((key) => sectionsByKey[key])
    .filter((section) => section.items.length > 0);

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
    <Page justify="end">
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
                    title={section.getTitle(item)}
                    subtitle={section.getSubtitle(item)}
                    imgSrc={section.getImageSrc(item)}
                    width={'25vh'}
                    aspectRatio={section.aspectRatio}
                    onFocus={() => {
                      setFocusedElementId(`${section.key}-${item.id}`);
                    }}
                    action={() => {
                      navigate(`/details/${section.itemType}/${item.id}`);
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
