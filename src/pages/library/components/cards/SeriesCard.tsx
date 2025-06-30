import { Button } from '@/components/ui/button'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { Series } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import { getOnlyYear } from '@/utils/ReactUtils'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ParentCard from './ParentCard'
import { shallow } from 'zustand/shallow'

interface SeriesCardProps {
  series: Series
  mutateLibrary: () => void
}

function SeriesCard({ series, mutateLibrary }: SeriesCardProps) {
  const { t } = useTranslation()
  const selectedServer = useServerStore((state) => state.selectedServer)
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
  const [remainingEpisodes, setRemainingEpisodes] = useState<
    number | undefined
  >(undefined)
  const navigate = useNavigate()

  const toggleSeriesWatched = async () => {
    if (series) {
      fetch(`https://${selectedServer?.ip}/setSeriesWatched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seriesId: series.id,
          watched: !series.watched,
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
            action: () => openIdentificationDialog(series, undefined),
          },
          {
            title: t('changeEpisodesGroup'),
            action: () => openEpisodesGroupDialog(series),
          },
          {
            title: series.watched ? t('markUnwatched') : t('markWatched'),
            action: toggleSeriesWatched,
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

  const getRemainingEpisodes = async () => {
    const response = await fetch(
      `https://${selectedServer?.ip}/remaining-episodes?seriesId=${series.id}`,
    )

    if (!response.ok) {
      return undefined
    }

    const data = await response.json()
    return data.remainingEpisodes
  }

  // Get remaining episodes
  getRemainingEpisodes().then((data) => {
    setRemainingEpisodes(data)
  })

  return (
    <ParentCard
      itemKey={series.id}
      type="Shows"
      imgSrc={series.coverSrc}
      title={series.name}
      subtitle={getOnlyYear(series.year).toString()}
      action={() => {
        selectSeries(series.id)
        navigate(`/server/${selectedServer?.id}/details/series/${series.id}`)
      }}
      hidePlayButton
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
