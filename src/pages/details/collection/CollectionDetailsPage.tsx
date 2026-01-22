import useScreenHeight from '@/components/hooks/use-height'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { SortableHorizontalList } from '@/components/lists/SortableHorizontalList'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Skeleton } from '@/components/ui/skeleton'
import { API, authenticatedFetch, authenticatedFetcher } from '@/config/api'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useWebSocketStore } from '@/context/ws.context'
import {
  Collection,
  CollectionImages,
  Movie,
  Series,
} from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import AlbumCard from '@/pages/library/components/cards/AlbumCard'
import MovieCard from '@/pages/library/components/cards/MovieCard'
import SeriesCard from '@/pages/library/components/cards/SeriesCard'
import { CollectionKey, ContentType } from '@/types/types'
import { getCoverSize, getTitleSize } from '@/utils/ReactUtils'
import { Ellipsis, Pencil } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import '../DetailsPage.css'
import CollectionImage from './CollectionImage'

function CollectionDetailsPage() {
  const { collectionId, type } = useParams()
  const isAdmin = useIsAdmin()
  const wsMessage = useWebSocketStore((state) => state.wsMessage)
  const openCollectionDialog = useDialogStore(
    (state) => state.openCollectionDialog,
  )
  const { setCurrentBackground, currentBackground } = useDataStore(
    (state) => ({
      setCurrentBackground: state.setCurrentBackground,
      currentBackground: state.currentBackground,
    }),
    shallow,
  )
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const screenHeight = useScreenHeight()

  const {
    data: collection,
    isLoading,
    mutate,
  } = useSWR<Collection>(
    API.collections.get(collectionId ?? ''),
    authenticatedFetcher,
  )

  const { data: collectionImages } = useSWR<CollectionImages>(
    collection
      ? `/api/collection-images?collectionId=${collection.id}&&type=${type}`
      : null,
    authenticatedFetcher,
  )

  const [localCollection, setLocalCollection] = useState<Collection | null>(
    null,
  )

  useEffect(() => {
    if (collection) {
      setLocalCollection(collection)
    }
  }, [collection])

  useEffect(() => {
    const image =
      collection && collection.backgroundSrc && collection.backgroundSrc !== ''
        ? collection.backgroundSrc
        : collectionImages &&
            collectionImages.background &&
            collectionImages.background !== ''
          ? collectionImages.background
          : currentBackground
    if (collection && image !== currentBackground) {
      setCurrentBackground(image)
    }
  }, [collection, collectionImages, setCurrentBackground])

  async function handleDragEnd(
    sourceIndex: number,
    destinationIndex: number,
    listKey: 'movies' | 'shows' | 'albums',
  ) {
    if (!localCollection) return

    let reorderedList: Movie[] | Series[] | Album[]
    let orderedItemsForApi: { id: string; type: string }[]

    switch (listKey) {
      case 'movies': {
        const list = [...localCollection.movies]
        const [movedItem] = list.splice(sourceIndex, 1)
        list.splice(destinationIndex, 0, movedItem)
        reorderedList = list

        setLocalCollection((prev) => ({
          ...prev!,
          movies: list,
        }))

        orderedItemsForApi = list.map((item) => ({
          id: item.id,
          type: 'movie',
        }))
        break
      }

      case 'shows': {
        const list = [...localCollection.shows]
        const [movedItem] = list.splice(sourceIndex, 1)
        list.splice(destinationIndex, 0, movedItem)
        reorderedList = list

        setLocalCollection((prev) => ({
          ...prev!,
          shows: list,
        }))

        orderedItemsForApi = list.map((item) => ({
          id: item.id,
          type: 'show',
        }))
        break
      }

      case 'albums': {
        const list = [...localCollection.albums]
        const [movedItem] = list.splice(sourceIndex, 1)
        list.splice(destinationIndex, 0, movedItem)
        reorderedList = list

        setLocalCollection((prev) => ({
          ...prev!,
          albums: list,
        }))

        orderedItemsForApi = list.map((item) => ({
          id: item.id,
          type: 'album',
        }))
        break
      }

      default:
        return
    }

    try {
      await authenticatedFetch(
        API.collections.reorderContent(collectionId ?? ''),
        'POST',
        {
          collectionId: collectionId,
          orderedItems: orderedItemsForApi,
        },
      )
    } catch (error) {
      if (collection) {
        setLocalCollection(collection)
      }
    } finally {
      mutate()
    }
  }

  function getYearRange(): string {
    if (!collection) return 'N/A'

    const years =
      type === 'Music'
        ? collection.albums
            .map((album) => album.year)
            .filter((year) => year !== '')
        : type === 'Movies'
          ? collection.movies
              .map((movie) => movie.year)
              .filter((year) => year !== '')
          : type === 'Shows'
            ? collection.shows
                .map((show) => show.year)
                .filter((year) => year !== '')
            : []

    if (years.length === 0) {
      return 'N/A'
    }

    const numericYears = years.map((year) => (year ? parseInt(year, 10) : 0))

    const minYear = Math.min(...numericYears)
    const maxYear = Math.max(...numericYears)

    if (minYear === maxYear) {
      return `${minYear}`
    } else {
      return `${minYear} - ${maxYear}`
    }
  }

  const orderMap: Record<ContentType, CollectionKey[]> = {
    Music: ['albums', 'movies', 'shows'],
    Shows: ['shows', 'movies', 'albums'],
    Movies: ['movies', 'shows', 'albums'],
  }

  const renderMap: Record<CollectionKey, (items: any[]) => React.ReactNode> = {
    albums: (items: Album[]) => (
      <FlexBox
        key={'Albums'}
        direction="column"
        justify="center"
        align="center"
        width={'100%'}
      >
        <SortableHorizontalList
          title={t('albums')}
          items={items}
          onDragEnd={(sourceIndex, destinationIndex) =>
            handleDragEnd(sourceIndex, destinationIndex, 'albums')
          }
          renderItem={(item: Album) => (
            <div key={item.id} className={isMobile ? 'w-45' : ''}>
              <AlbumCard album={item} />
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
              <MovieCard movie={item} />
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
              <SeriesCard series={item} remainingEpisodes={0} />
            </div>
          )}
        />
      </FlexBox>
    ),
  }

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
                className={`${!isMobile ? getCoverSize(screenHeight, type !== 'Music', false) : `h-screen ${type === 'Music' ? 'max-h-[55dvw]' : 'max-h-[80dvw]'} w-screen max-w-[55dvw]`}`}
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
            <span
              className={`${getTitleSize(screenHeight, isMobile)} font-black`}
            >
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
                      openCollectionDialog(collection)
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
          const items = collection[key]
          return items.length > 0 ? renderMap[key](items) : null
        })
      )}
    </FlexBox>
  )
}

export default CollectionDetailsPage
