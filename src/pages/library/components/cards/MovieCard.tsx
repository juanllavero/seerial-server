import { Button } from '@/components/ui/button'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { Movie } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import { getOnlyYear } from '@/utils/ReactUtils'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ParentCard from './ParentCard'
import { shallow } from 'zustand/shallow'

interface MovieCardProps {
  movie: Movie
  mutateLibrary: () => void
}

function MovieCard({ movie, mutateLibrary }: MovieCardProps) {
  const { t } = useTranslation()
  const selectMovie = useDataStore((state) => state.selectMovie)
  const selectedServer = useServerStore((state) => state.selectedServer)
  const { openMovieDialog, openIdentificationDialog } = useDialogStore(
    (state) => ({
      openMovieDialog: state.openMovieDialog,
      openIdentificationDialog: state.openIdentificationDialog,
    }),
    shallow,
  )
  const navigate = useNavigate()

  const toggleMovieWatched = async () => {
    if (movie) {
      fetch(`https://${selectedServer?.ip}/setMovieWatched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movie.id,
          watched: !movie.watched,
        }),
      }).then(() => {
        mutateLibrary()
      })
    }
  }

  const menuContent: DropdownContent = {
    items: [
      {
        separator: false,
        items: [
          {
            title: t('updateMetadata'),
            action: () => console.log('Profile clicked'),
          },
          {
            title: t('correctIdentification'),
            action: () => openIdentificationDialog(undefined, movie),
          },
          {
            title: movie.watched ? t('markUnwatched') : t('markWatched'),
            action: toggleMovieWatched,
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
      watched={movie.watched}
      action={() => {
        selectMovie(movie.id)
        navigate(`/server/${selectedServer?.id}/details/movie/${movie.id}`)
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
