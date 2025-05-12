import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Series } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import { getOnlyYear } from '@/utils/ReactUtils'
import { useNavigate } from '@tanstack/react-router'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ParentCard from './ParentCard'

interface SeriesCardProps {
  series: Series
}

function SeriesCard({ series }: SeriesCardProps) {
  const { t } = useTranslation()
  const { serverIP } = useServerStore()
  const { selectSeries } = useDataStore()
  const [remainingEpisodes, setRemainingEpisodes] = useState<
    number | undefined
  >(undefined)
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

  const getRemainingEpisodes = async () => {
    const response = await fetch(
      `http://${serverIP}/remaining-episodes?seriesId=${series.id}`,
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
        navigate({
          to: '/details/series/$seriesId',
          params: { seriesId: series.id },
        })
      }}
      hidePlayButton
      cornerNumber={remainingEpisodes}
      menuContent={menuContent}
      editModal={<></>}
      errorSrc="/img/fileNotFound.jpg"
    />
  )
}

export default SeriesCard
