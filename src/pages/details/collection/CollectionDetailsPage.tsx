import { useIsMobile } from '@/components/hooks/use-mobile'
import Loading from '@/components/Loading'
import NotFound from '@/components/NotFound'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Collection, Movie, Series } from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
import HorizontalList from '@/pages/home/components/HorizontalList'
import AlbumCard from '@/pages/library/components/cards/AlbumCard'
import MovieCard from '@/pages/library/components/cards/MovieCard'
import SeriesCard from '@/pages/library/components/cards/SeriesCard'
import { fetcher } from '@/utils/utils'
import { useParams } from '@tanstack/react-router'
import { Edit, Ellipsis } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import '../DetailsPage.css'

function CollectionDetailsPage() {
  const { collectionId, type } = useParams({
    from: '/details/collection/$collectionId/$type',
  })
  const { t } = useTranslation()
  const { setCurrentBackground } = useDataStore()
  const { wsMessage } = useWebSocketStore()
  const { selectedServer } = useServerStore()
  const isMobile = useIsMobile()

  // Get collection data
  const {
    data: collection,
    isLoading,
    mutate,
  } = useSWR<Collection>(
    collectionId && selectedServer
      ? `https://${selectedServer.ip}/details/collection?id=${collectionId}`
      : null,
    fetcher,
  )

  const [currentPoster, setCurrentPoster] = useState<string | undefined>()
  const [nextPoster, setNextPoster] = useState<string | undefined>()
  const [showAnimPoster, setShowAnimPoster] = useState(false)

  const posterUrl = collection?.coverSrc

  // Mutate content on ws message
  useEffect(() => {
    if (wsMessage === MessageType.MUTATE_LIBRARY) {
      mutate()
    }
  }, [wsMessage])

  useEffect(() => {
    setNextPoster(posterUrl)
    setShowAnimPoster(true)

    setTimeout(() => {
      setCurrentPoster(posterUrl)
      setTimeout(() => {
        setShowAnimPoster(false)
      }, 100)
    }, 1000)
  }, [posterUrl])

  // Set background image src
  useEffect(() => {
    if (collection) {
      setCurrentBackground(collection.backgroundSrc)
    } else {
      setCurrentBackground(undefined)
    }
  }, [collection])

  if (isLoading) {
    return <Loading />
  }

  if (!collection) {
    return <NotFound />
  }

  type ContentType = 'Music' | 'Shows' | 'Movies'
  type CollectionKey = keyof CollectionItems
  type CollectionItems = {
    albums: Album[]
    movies: Movie[]
    shows: Series[]
  }

  // Define el orden según type
  const orderMap: Record<ContentType, CollectionKey[]> = {
    Music: ['albums', 'movies', 'shows'],
    Shows: ['shows', 'movies', 'albums'],
    Movies: ['movies', 'shows', 'albums'],
  }

  // Componentes de renderizado por tipo
  const renderMap: Record<CollectionKey, (items: any[]) => React.ReactNode> = {
    albums: (items: Album[]) => (
      <FlexBox direction="column" justify="center" align="center">
        <HorizontalList key="albums" title={t('albums')}>
          {items.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </HorizontalList>
      </FlexBox>
    ),
    movies: (items: Movie[]) => (
      <FlexBox direction="column" justify="start" align="start" gap={0}>
        <HorizontalList key="movies" title={t('movies')}>
          {items.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </HorizontalList>
      </FlexBox>
    ),
    shows: (items: Series[]) => (
      <FlexBox>
        <HorizontalList key="shows" title={t('shows')}>
          {items.map((series) => (
            <SeriesCard key={series.id} series={series} />
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
      padding={isMobile ? '10rem 0' : '10rem 3rem'}
      height={'100%'}
    >
      <FlexBox justify="start" align="start" gap={4} padding="0 0 1rem 0">
        {!isMobile && (
          <div className="cover-container">
            <FlexBox className="image-container">
              <LazyImage
                url={currentPoster}
                width={350}
                maxHeight={550}
                height={type === 'Music' ? 300 : 550}
                errorSrc={
                  type === 'Music'
                    ? '/img/songDefault.png'
                    : '/img/fileNotFound.jpg'
                }
              />
            </FlexBox>

            {showAnimPoster && (
              <FlexBox className="image-container-animated fade-in">
                <LazyImage
                  url={nextPoster}
                  width={350}
                  maxHeight={550}
                  height={type === 'Music' ? 300 : 550}
                  errorSrc={
                    type === 'Music'
                      ? '/img/songDefault.png'
                      : '/img/fileNotFound.jpg'
                  }
                />
              </FlexBox>
            )}
          </div>
        )}

        <FlexBox
          direction="column"
          gap={1}
          width={isMobile ? '100%' : '80%'}
          padding={isMobile ? '0 2rem' : '0'}
        >
          <span
            id="details-title"
            style={{
              textTransform: 'uppercase',
            }}
          >
            {collection.title}
          </span>
          <FlexBox gap={1} wrap="wrap">
            <Button variant={'ghost'} title={t('editButton')}>
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
              {collection.description || t('defaultOverview')}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      {/* Content */}
      {orderMap[type as ContentType].map((key) => {
        const items = collection[key]
        return items.length > 0 ? renderMap[key](items) : null
      })}
    </FlexBox>
  )
}

export default CollectionDetailsPage
