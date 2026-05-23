import { API, useCreate, useGetCollection } from '@seerial/api';
import type { Album, Collection, Movie, Series } from '@seerial/domain';
import { useIsAdmin } from '@seerial/hooks';
import { useDataStore } from '@seerial/stores';
import { Ellipsis, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { useDialogStore } from '@/features/management';
import { CollectionImage } from '@/features/media-details';
import Card from '@/shared/cards/card';
import useScreenHeight from '@/shared/hooks/use-height';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { getCoverSize, getTitleSize } from '@/shared/lib/react-utils';
import { SortableHorizontalList } from '@/shared/lists/sortable-horizontal-list';
import type { CollectionKey, ContentType } from '@/shared/types/types';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';
import { Skeleton } from '@/shared/ui/skeleton';

function CollectionDetailsPage() {
  const { collectionId, type } = useParams();
  const isAdmin = useIsAdmin();
  const { openDialog } = useDialogStore((state) => ({ openDialog: state.openDialog }), shallow);
  const { setCurrentBackground, currentBackground } = useDataStore(
    (state) => ({
      setCurrentBackground: state.setCurrentBackground,
      currentBackground: state.currentBackground,
    }),
    shallow,
  );
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const screenHeight = useScreenHeight();

  // Get collection data
  const { data: collection, isLoading, mutate } = useGetCollection(collectionId ?? '');
  const { create } = useCreate<unknown>();

  const [localCollection, setLocalCollection] = useState<Collection | null>(null);

  useEffect(() => {
    if (collection) {
      setLocalCollection(collection);
    }
  }, [collection]);

  useEffect(() => {
    if (
      collection?.backgroundSrc &&
      collection.backgroundSrc !== '' &&
      collection.backgroundSrc !== currentBackground
    ) {
      setCurrentBackground(collection.backgroundSrc);
    }
  }, [collection, setCurrentBackground, currentBackground]);

  async function handleDragEnd(
    sourceIndex: number,
    destinationIndex: number,
    listKey: 'movies' | 'shows' | 'albums',
  ) {
    if (!localCollection) return;

    let orderedItemsForApi: { id: string; type: string }[];

    switch (listKey) {
      case 'movies': {
        const list = [...localCollection.movies];
        const [movedItem] = list.splice(sourceIndex, 1);
        list.splice(destinationIndex, 0, movedItem);

        setLocalCollection((prev) => ({
          ...prev!,
          movies: list,
        }));

        orderedItemsForApi = list.map((item) => ({
          id: item.id,
          type: 'movie',
        }));
        break;
      }

      case 'shows': {
        const list = [...localCollection.shows];
        const [movedItem] = list.splice(sourceIndex, 1);
        list.splice(destinationIndex, 0, movedItem);

        setLocalCollection((prev) => ({
          ...prev!,
          shows: list,
        }));

        orderedItemsForApi = list.map((item) => ({
          id: item.id,
          type: 'show',
        }));
        break;
      }

      case 'albums': {
        const list = [...localCollection.albums];
        const [movedItem] = list.splice(sourceIndex, 1);
        list.splice(destinationIndex, 0, movedItem);

        setLocalCollection((prev) => ({
          ...prev!,
          albums: list,
        }));

        orderedItemsForApi = list.map((item) => ({
          id: item.id,
          type: 'album',
        }));
        break;
      }

      default:
        return;
    }

    try {
      await create(API.collections.reorderContent(collectionId ?? ''), {
        collectionId: collectionId,
        orderedItems: orderedItemsForApi,
      });
    } catch (_error) {
      if (collection) {
        setLocalCollection(collection);
      }
    } finally {
      mutate();
    }
  }

  function getYearRange(): string {
    if (!collection) return 'N/A';

    const years =
      type === 'Music' && collection.albums
        ? collection.albums.map((album) => album.year).filter((year) => year !== '')
        : type === 'Movies' && collection.movies
          ? collection.movies.map((movie) => movie.year).filter((year) => year !== '')
          : type === 'Shows' && collection.shows
            ? collection.shows.map((show) => show.year).filter((year) => year !== '')
            : [];

    if (years.length === 0) {
      return 'N/A';
    }

    const numericYears = years.map((year) => (year ? parseInt(year, 10) : 0));

    const minYear = Math.min(...numericYears);
    const maxYear = Math.max(...numericYears);

    if (minYear === maxYear) {
      return `${minYear}`;
    } else {
      return `${minYear} - ${maxYear}`;
    }
  }

  const orderMap: Record<ContentType, CollectionKey[]> = {
    Music: ['albums', 'movies', 'shows'],
    Shows: ['shows', 'movies', 'albums'],
    Movies: ['movies', 'shows', 'albums'],
  };

  type CollectionItemsByKey = {
    albums: Album[];
    movies: Movie[];
    shows: Series[];
  };

  const renderMap: {
    [K in CollectionKey]: (items: CollectionItemsByKey[K]) => ReactNode;
  } = {
    albums: (items: Album[]) => (
      <FlexBox key={'Albums'} direction="column" justify="center" align="center" width={'100%'}>
        <SortableHorizontalList
          title={t('albums')}
          items={items}
          onDragEnd={(sourceIndex, destinationIndex) =>
            handleDragEnd(sourceIndex, destinationIndex, 'albums')
          }
          renderItem={(item: Album) => (
            <div key={item.id} className={isMobile ? 'w-45' : ''}>
              <Card
                itemKey={item.id}
                imgSrc={item.coverSrc}
                aspectRatio={1}
                width={isMobile ? 100 : 150}
                title={item.title}
                subtitle={item.year ? new Date(item.year).getFullYear().toString() : ''}
                action={() => {
                  window.location.href = `/album/${item.id}`;
                }}
                hideButtons={false}
                menu={undefined}
                loading={false}
                editModal={undefined}
                cornerData={undefined}
                centerText={false}
                hidePlayButton={false}
                progress={0}
                cornerNumber={0}
                watched={false}
                errorSrc={'/img/fileNotFound.jpg'}
              />
            </div>
          )}
        />
      </FlexBox>
    ),
    movies: (items: Movie[]) => (
      <FlexBox
        key={'Movies'}
        direction="column"
        width={'100%'}
        justify="start"
        align="start"
        gap={0}
      >
        <SortableHorizontalList
          title={t('movies')}
          items={items}
          onDragEnd={(sourceIndex, destinationIndex) =>
            handleDragEnd(sourceIndex, destinationIndex, 'movies')
          }
          renderItem={(item: Movie) => (
            <div key={item.id} className={isMobile ? 'w-45' : ''}>
              <Card
                itemKey={item.id}
                imgSrc={item.coverSrc}
                aspectRatio={1}
                width={isMobile ? 100 : 150}
                title={item.name}
                subtitle={item.year ? new Date(item.year).getFullYear().toString() : ''}
                action={() => {
                  window.location.href = `/movie/${item.id}`;
                }}
                hideButtons={false}
                menu={undefined}
                loading={false}
                editModal={undefined}
                cornerData={undefined}
                centerText={false}
                hidePlayButton={false}
                progress={0}
                cornerNumber={0}
                watched={false}
                errorSrc={'/img/fileNotFound.jpg'}
              />
            </div>
          )}
        />
      </FlexBox>
    ),
    shows: (items: Series[]) => (
      <FlexBox key={'Shows'} width={'100%'}>
        <SortableHorizontalList
          title={t('shows')}
          items={items}
          onDragEnd={(sourceIndex, destinationIndex) =>
            handleDragEnd(sourceIndex, destinationIndex, 'shows')
          }
          renderItem={(item: Series) => (
            <div key={item.id} className={isMobile ? 'w-45' : ''}>
              <Card
                itemKey={item.id}
                imgSrc={item.coverSrc}
                aspectRatio={1}
                width={isMobile ? 100 : 150}
                title={item.name}
                subtitle={item.year ? new Date(item.year).getFullYear().toString() : ''}
                action={() => {
                  window.location.href = `/series/${item.id}`;
                }}
                hideButtons={false}
                menu={undefined}
                loading={false}
                editModal={undefined}
                cornerData={undefined}
                centerText={false}
                hidePlayButton={false}
                progress={0}
                cornerNumber={0}
                watched={false}
                errorSrc={'/img/fileNotFound.jpg'}
              />
            </div>
          )}
        />
      </FlexBox>
    ),
  };

  return (
    <FlexBox
      className="details-container"
      direction="column"
      gap={1}
      wrap="nowrap"
      padding={isMobile ? '3rem 0 5rem 0' : '2rem 3rem 5rem 3rem'}
      width={'100%'}
      height={'100%'}
    >
      <FlexBox
        direction={isMobile ? 'column' : 'row'}
        justify="start"
        align={isMobile ? 'center' : 'start'}
        width={'100%'}
        gap={4}
        padding="0 0 1rem 0"
      >
        <div className="cover-container">
          <FlexBox className="image-container">
            {isLoading || !collection ? (
              <Skeleton
                className={`${isMobile ? `h-screen ${type === 'Music' ? 'max-h-[55dvw]' : 'max-h-[80dvw]'} w-screen max-w-[55dvw]` : getCoverSize(screenHeight, type !== 'Music', false)}`}
              />
            ) : (
              <CollectionImage collection={collection} type={type ?? ''} />
            )}
          </FlexBox>
        </div>

        <FlexBox
          direction="column"
          align={isMobile ? 'center' : 'start'}
          gap={1}
          width={isMobile ? '100%' : '80%'}
          padding={isMobile ? '0 2rem' : '0'}
        >
          {isLoading || !collection ? (
            <Skeleton className="h-15 w-90" />
          ) : (
            <span className={`${getTitleSize(screenHeight, isMobile)} font-black`}>
              {collection.title}
            </span>
          )}

          <span>{getYearRange()}</span>

          <FlexBox gap={1} wrap="wrap">
            {isAdmin && (
              <>
                <Button
                  variant={'ghost'}
                  title={t('editButton')}
                  onClick={() => {
                    if (collection) {
                      openDialog('collection', {
                        id: collection.id,
                      });
                    }
                  }}
                >
                  <Pencil />
                </Button>
                <Button variant={'ghost'}>
                  <Ellipsis />
                </Button>
              </>
            )}
          </FlexBox>
          <FlexBox>
            <span className="font-semibold">
              {isLoading || !collection ? (
                <Skeleton className="h-30 w-60" />
              ) : (
                (collection.description ?? '')
              )}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      {isLoading || !collection ? (
        <Skeleton className="h-30 w-90" />
      ) : (
        orderMap[type as ContentType].map((key) => {
          const items = collection[key];

          if (!items || items.length === 0) {
            return null;
          }

          switch (key) {
            case 'albums':
              return renderMap.albums(items as Album[]);
            case 'movies':
              return renderMap.movies(items as Movie[]);
            case 'shows':
              return renderMap.shows(items as Series[]);
          }
        })
      )}
    </FlexBox>
  );
}

export default CollectionDetailsPage;
