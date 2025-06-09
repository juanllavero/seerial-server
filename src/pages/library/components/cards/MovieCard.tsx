import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Movie } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import { getOnlyYear } from '@/utils/ReactUtils'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ParentCard from './ParentCard'

interface MovieCardProps {
  movie: Movie
}

function MovieCard({ movie }: MovieCardProps) {
  const { t } = useTranslation()
  const { selectMovie } = useDataStore()
  const { selectedServer } = useServerStore()
  const navigate = useNavigate()

  const menuContent: DropdownContent = {
    items: [
      {
        separator: false,
        items: [
          {
            title: t('updateMetadata'),
            action: () => console.log('Profile clicked'),
          },
          //   {
          //     title: t('correctIdentification'),
          //     action: () => openIdentificationDialog(series, undefined),
          //     hidden: library.type !== 'Shows',
          //   },
          //   {
          //     title: t('changeEpisodesGroup'),
          //     action: () => openEpisodesGroupDialog(series),
          //     hidden: library.type !== 'Shows',
          //   },
          //   {
          //     title: series.watched ? t('markUnwatched') : t('markWatched'),
          //     action: () => console.log('Log out clicked'),
          //     hidden: library.type === 'Music',
          //   },
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

  // console.log('MovieCard: ', movie.id)

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
      editModal={<></>}
      errorSrc="/img/fileNotFound.jpg"
    />
  )
}

export default MovieCard
