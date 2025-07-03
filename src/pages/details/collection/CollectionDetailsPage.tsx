import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import { Skeleton } from '@/components/ui/skeleton'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Collection, Movie, Series } from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
import HorizontalList from '@/pages/home/components/HorizontalList'
import AlbumCard from '@/pages/library/components/cards/AlbumCard'
import MovieCard from '@/pages/library/components/cards/MovieCard'
import SeriesCard from '@/pages/library/components/cards/SeriesCard'
import { CollectionKey, ContentType } from '@/types/types'
import { fetcher } from '@/utils/utils'
import { Edit, Ellipsis } from 'lucide-react'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import '../DetailsPage.css'
import CollectionImage from './CollectionImage'
import { shallow } from 'zustand/shallow'
import ExtrasList from './components/ExtrasList'
function CollectionDetailsPage() {
  const { collectionId, type } = useParams()
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
  const selectedServer = useServerStore((state) => state.selectedServer)
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const serverIP = selectedServer?.ip

  // Get collection data
  const {
    data: collection,
    isLoading,
    mutate,
  } = useSWR<Collection>(
    `https://${serverIP}/details/collection?id=${collectionId}`,
    fetcher,
  )

  // Update selected server
  // useEffect(() => {
  //   if (server !== selectedServer) {
  //     selectServer(server)
  //   }
  // }, [])

  // Mutate content on ws message
  useEffect(() => {
    if (wsMessage === MessageType.MUTATE_LIBRARY) {
      mutate()
    }
  }, [wsMessage, mutate])

  // Set background image src
  useEffect(() => {
    if (collection && collection.backgroundSrc !== currentBackground) {
      setCurrentBackground(collection.backgroundSrc)
    } else if (currentBackground) {
      setCurrentBackground(undefined)
    }
  }, [collection, currentBackground, setCurrentBackground])

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

  // Set order of content
  const orderMap: Record<ContentType, CollectionKey[]> = {
    Music: ['albums', 'movies', 'shows'],
    Shows: ['shows', 'movies', 'albums'],
    Movies: ['movies', 'shows', 'albums'],
  }

  // Render content by type
  const renderMap: Record<CollectionKey, (items: any[]) => React.ReactNode> = {
    albums: (items: Album[]) => (
      <FlexBox
        key={'Albums'}
        direction="column"
        justify="center"
        align="center"
      >
        <HorizontalList key="albums" title={t('albums')}>
          {items.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </HorizontalList>
      </FlexBox>
    ),
    movies: (items: Movie[]) => (
      <FlexBox
        key={'Movies'}
        direction="column"
        justify="start"
        align="start"
        gap={0}
      >
        <HorizontalList key="movies" title={t('movies')}>
          {items.map((movie) => (
            <MovieCard key={movie.id} movie={movie} mutateLibrary={mutate} />
          ))}
        </HorizontalList>
      </FlexBox>
    ),
    shows: (items: Series[]) => (
      <FlexBox key={'Shows'}>
        <HorizontalList key="shows" title={t('shows')}>
          {items.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              mutateLibrary={mutate}
            />
          ))}
        </HorizontalList>
      </FlexBox>
    ),
  }

  return (
    <FlexBox
      className="details-container"
      direction="column"
      gap={1}
      wrap="nowrap"
      padding={isMobile ? '3rem 0' : '2rem 3rem 5rem 3rem'}
      width={'100%'}
      height={'100%'}
    >
      <FlexBox justify="start" align="start" gap={4} padding="0 0 1rem 0">
        {!isMobile && (
          <div className="cover-container">
            <FlexBox className="image-container">
              {isLoading || !collection ? (
                <Skeleton
                  style={{
                    width: '330px',
                    height: `${type === 'Music' ? '300' : '495'}px`,
                  }}
                />
              ) : (
                <CollectionImage collection={collection} type={type ?? ''} />
              )}
            </FlexBox>
          </div>
        )}

        <FlexBox
          direction="column"
          gap={1}
          width={isMobile ? '100%' : '80%'}
          padding={isMobile ? '0 2rem' : '0'}
        >
          {isLoading || !collection ? (
            <Skeleton className="h-15 w-90" />
          ) : (
            <span className="text-6xl font-black">{collection.title}</span>
          )}

          <span>{getYearRange()}</span>

          <FlexBox gap={1} wrap="wrap">
            <Button
              variant={'ghost'}
              title={t('editButton')}
              onClick={() => {
                if (collection) {
                  openCollectionDialog(collection)
                }
              }}
            >
              <Edit />
            </Button>
            <Button
              variant={'ghost'}
              // onClick={(e) => {
              //   dispatch(toggleSeasonMenu())
              //   if (!seasonMenuOpen) cm.current?.show(e)
              // }}
            >
              <Ellipsis />
            </Button>
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

      {/* Content */}
      {isLoading || !collection ? (
        <Skeleton className="h-30 w-90" />
      ) : (
        orderMap[type as ContentType].map((key) => {
          const items = collection[key]
          return items.length > 0 ? renderMap[key](items) : null
        })
      )}

      {collection && <ExtrasList collection={collection} />}
    </FlexBox>
  )
}

export default CollectionDetailsPage
