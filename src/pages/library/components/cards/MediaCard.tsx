import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { authenticatedFetcher } from '@/config/api'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import {
  Collection,
  CollectionImages,
  Library,
  LibraryItem,
  Movie,
  Series,
} from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
import { DropdownContent } from '@/data/interfaces/Utils'
import { useCardWidth } from '@/hooks/useCardWidth'
import {
  getOnlyYear,
  getPosterImage,
  refreshMetadata,
  toggleMovieWatched,
  toggleSeriesWatched,
} from '@/utils/ReactUtils'
import { Pencil } from 'lucide-react'
import { memo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'

interface MediaCardProps {
  item: LibraryItem
  library: Library
}

function MediaCard({ item, library }: MediaCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { cardWidth } = useCardWidth()
  const isMobile = useIsMobile()
  const width = isMobile ? '100%' : cardWidth * 1.2

  const { user } = useServerStore(
    (state) => ({ user: state.currentUser }),
    shallow,
  )
  const {
    selectSeries,
    selectMovie,
    selectAlbum,
    selectCollection,
    setCurrentBackground,
  } = useDataStore(
    (state) => ({
      selectSeries: state.selectSeries,
      selectMovie: state.selectMovie,
      selectAlbum: state.selectAlbum,
      selectCollection: state.selectCollection,
      setCurrentBackground: state.setCurrentBackground,
    }),
    shallow,
  )
  const {
    openSeriesDialog,
    openMovieDialog,
    openAlbumDialog,
    openCollectionDialog,
    openIdentificationDialog,
    openEpisodesGroupDialog,
  } = useDialogStore(
    (state) => ({
      openSeriesDialog: state.openSeriesDialog,
      openMovieDialog: state.openMovieDialog,
      openAlbumDialog: state.openAlbumDialog,
      openCollectionDialog: state.openCollectionDialog,
      openIdentificationDialog: state.openIdentificationDialog,
      openEpisodesGroupDialog: state.openEpisodesGroupDialog,
    }),
    shallow,
  )

  const queryType =
    library.type === LibraryTypes.MUSIC
      ? 'Music'
      : library.type === LibraryTypes.SHOWS
        ? 'Shows'
        : 'Movies'
  const aspectRatio = queryType === 'Music' ? 1 : 2 / 3
  const errorSrc =
    queryType === 'Music' ? '/img/songDefault.png' : '/img/fileNotFound.jpg'
  const id = item.data.id
  const isCollection = item.type === 'collection'
  const isShows = !isCollection && library.type === LibraryTypes.SHOWS
  const isMovies = !isCollection && library.type === LibraryTypes.MOVIES
  const isMusic = !isCollection && library.type === LibraryTypes.MUSIC

  const { data: collectionImages } = useSWR<CollectionImages>(
    isCollection
      ? `/api/collection-images?collectionId=${id}&type=${queryType}`
      : null,
    authenticatedFetcher,
  )

  let title: string
  let subtitle: string
  let imgSrc: string
  let collageComponent: React.ReactNode | undefined = undefined
  let watched: boolean | undefined = false
  let cornerNumber: number | undefined = undefined
  let action: () => void
  let editModal: React.ReactNode
  let remaining = 0

  if (isCollection) {
    const collection = item.data as Collection
    title = collection.title
    subtitle = `${collection.numberOfItems ?? 0} ${t('elements')}`
    action = () => {
      selectCollection(id)
      navigate(`/details/collection/${id}/${queryType}`)
    }
    editModal = (
      <Button
        variant={'ghost'}
        size={'icon'}
        onClick={(e) => {
          e.stopPropagation()
          openCollectionDialog(collection)
        }}
      >
        <Pencil size={16} />
      </Button>
    )
    if (collectionImages) {
      const images = collectionImages.images ?? []
      collageComponent =
        images.length > 1 ? getPosterImage(id, images, queryType) : undefined
      imgSrc =
        collection.coverSrc !== ''
          ? collection.coverSrc
          : collectionImages.poster && collectionImages.poster !== ''
            ? collectionImages.poster
            : images.length > 0
              ? images[0]
              : errorSrc
    } else {
      imgSrc = errorSrc
    }
  } else if (isShows) {
    const series = item.data as Series
    remaining = item.remainingItems ?? 0
    title = series.name
    subtitle = getOnlyYear(series.year).toString()
    watched = remaining === 0
    cornerNumber = remaining
    imgSrc = series.coverSrc
    action = () => {
      selectSeries(id)
      navigate(`series/${id}`)
    }
    editModal = (
      <Button
        variant={'ghost'}
        size={'icon'}
        onClick={(e) => {
          e.stopPropagation()
          openSeriesDialog(series)
        }}
      >
        <Pencil size={16} />
      </Button>
    )
  } else if (isMovies) {
    const movie = item.data as Movie
    title = movie.name
    subtitle = getOnlyYear(movie.year).toString()
    watched = movie.watchStatus !== undefined
    imgSrc = movie.coverSrc
    action = () => {
      selectMovie(id)
      navigate(`movie/${id}`)
    }
    editModal = (
      <Button
        variant={'ghost'}
        size={'icon'}
        onClick={(e) => {
          e.stopPropagation()
          openMovieDialog(movie)
        }}
      >
        <Pencil size={16} />
      </Button>
    )
  } else if (isMusic) {
    const album = item.data as Album
    title = album.title
    subtitle = album.year ?? '-'
    imgSrc = album.coverSrc
    action = () => {
      selectAlbum(id)
      navigate(`/details/album/${id}`)
    }
    editModal = (
      <Button
        variant={'ghost'}
        size={'icon'}
        onClick={(e) => {
          e.stopPropagation()
          openAlbumDialog(album)
        }}
      >
        <Pencil size={16} />
      </Button>
    )
  } else {
    return null // Fallback, should not happen
  }

  useEffect(() => {
    if (isCollection && collectionImages?.background) {
      setCurrentBackground(
        (item.data as Collection).backgroundSrc || collectionImages.background,
      )
    }
  }, [collectionImages, setCurrentBackground, isCollection, item.data])

  const menuContent: DropdownContent = {
    items: [
      {
        separator: false,
        items: [
          ...(isShows || isMovies || isMusic
            ? [
                {
                  title: t('updateMetadata'),
                  action: () =>
                    isShows || isMovies
                      ? refreshMetadata(isShows ? 'show' : 'movie', id)
                      : console.log('Update metadata'),
                },
              ]
            : []),
          ...(isShows || isMovies
            ? [
                {
                  title: t('correctIdentification'),
                  action: () =>
                    openIdentificationDialog(
                      isShows ? (item.data as Series) : undefined,
                      isMovies ? (item.data as Movie) : undefined,
                    ),
                },
              ]
            : []),
          ...(isShows
            ? [
                {
                  title: t('changeEpisodesGroup'),
                  action: () => openEpisodesGroupDialog(item.data as Series),
                },
              ]
            : []),
          ...(isShows || isMovies
            ? [
                {
                  title: watched ? t('markUnwatched') : t('markWatched'),
                  action: () =>
                    user &&
                    (isShows
                      ? toggleSeriesWatched(item.data as Series, user.id)
                      : toggleMovieWatched(item.data as Movie, user.id)),
                },
              ]
            : []),
        ],
      },
      { separator: true, items: [] },
      {
        separator: false,
        items: [
          {
            title: t('removeButton'),
            action: () => console.log('Remove clicked'),
          },
        ],
      },
    ],
  }

  return (
    <Card
      itemKey={id}
      width={width}
      imgSrc={imgSrc}
      collageComponent={collageComponent}
      aspectRatio={aspectRatio}
      title={title}
      subtitle={subtitle}
      cornerData=""
      cornerNumber={cornerNumber}
      action={action}
      watched={watched}
      loading={false}
      hidePlayButton
      menu={menuContent}
      editModal={editModal}
      errorSrc={errorSrc}
    />
  )
}

export default memo(MediaCard)
