import { Button } from '@/components/ui/button'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { Movie } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import {
  getOnlyYear,
  refreshMetadata,
  toggleMovieWatched,
} from '@/utils/ReactUtils'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { shallow } from 'zustand/shallow'
import ParentCard from './ParentCard'

interface MovieCardProps {
  movie: Movie
}

function MovieCard({ movie }: MovieCardProps) {
  const { t } = useTranslation()
  const selectMovie = useDataStore((state) => state.selectMovie)
  const { user } = useServerStore(
    (state) => ({
      user: state.currentUser,
    }),
    shallow,
  )
  const { openMovieDialog, openIdentificationDialog } = useDialogStore(
    (state) => ({
      openMovieDialog: state.openMovieDialog,
      openIdentificationDialog: state.openIdentificationDialog,
    }),
    shallow,
  )
  const navigate = useNavigate()

  const menuContent: DropdownContent = {
    items: [
      {
        separator: false,
        items: [
          {
            title: t('updateMetadata'),
            action: () => refreshMetadata('movie', movie.id),
          },
          {
            title: t('correctIdentification'),
            action: () => openIdentificationDialog(undefined, movie),
          },
          {
            title:
              movie.watchStatus !== undefined
                ? t('markUnwatched')
                : t('markWatched'),
            action: () => user && toggleMovieWatched(movie, user.id),
          },
        ],
      },
      { separator: true, items: [] },
      {
        separator: false,
        items: [
          {
            title: t('removeButton'),
            action: () => console.log('Log out clicked'),
          },
        ],
      },
    ],
  }

  return (
    <ParentCard
      itemKey={movie.id}
      type="Movies"
      imgSrc={movie.coverSrc}
      title={movie.name}
      subtitle={getOnlyYear(movie.year).toString()}
      watched={movie.watchStatus !== undefined}
      action={() => {
        selectMovie(movie.id)
        navigate(`/details/movie/${movie.id}`)
      }}
      hidePlayButton
      menuContent={menuContent}
      editModal={
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
      }
      errorSrc="/img/fileNotFound.jpg"
    />
  )
}

export default MovieCard
