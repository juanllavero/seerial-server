import { Button } from '@/components/ui/button'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { Series } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import {
  getOnlyYear,
  refreshMetadata,
  toggleSeriesWatched,
} from '@/utils/ReactUtils'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { shallow } from 'zustand/shallow'
import ParentCard from './ParentCard'

interface SeriesCardProps {
  series: Series
  remainingEpisodes: number
}

function SeriesCard({ series, remainingEpisodes }: SeriesCardProps) {
  const { t } = useTranslation()
  const { user, serverUrl } = useServerStore(
    (state) => ({
      user: state.currentUser,
      serverUrl: state.serverUrl,
    }),
    shallow,
  )
  const selectSeries = useDataStore((state) => state.selectSeries)
  const {
    openSeriesDialog,
    openIdentificationDialog,
    openEpisodesGroupDialog,
  } = useDialogStore(
    (state) => ({
      openSeriesDialog: state.openSeriesDialog,
      openIdentificationDialog: state.openIdentificationDialog,
      openEpisodesGroupDialog: state.openEpisodesGroupDialog,
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
            action: () => refreshMetadata('show', series.id),
          },
          {
            title: t('correctIdentification'),
            action: () => openIdentificationDialog(series, undefined),
          },
          {
            title: t('changeEpisodesGroup'),
            action: () => openEpisodesGroupDialog(series),
          },
          {
            title:
              series.watchStatus !== undefined
                ? t('markUnwatched')
                : t('markWatched'),
            action: () =>
              user && toggleSeriesWatched(serverUrl, series, user.id),
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
      itemKey={series.id}
      type="Shows"
      imgSrc={series.coverSrc}
      title={series.name}
      subtitle={getOnlyYear(series.year).toString()}
      action={() => {
        selectSeries(series.id)
        navigate(`/details/series/${series.id}`)
      }}
      hidePlayButton
      watched={remainingEpisodes === 0}
      cornerNumber={remainingEpisodes}
      menuContent={menuContent}
      editModal={
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
      }
      errorSrc="/img/fileNotFound.jpg"
    />
  )
}

export default SeriesCard
