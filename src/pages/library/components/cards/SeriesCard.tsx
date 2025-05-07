import useDataStore from '@/context/data.context'
import { Series } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import { useNavigate } from '@tanstack/react-router'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ParentCard from './ParentCard'

interface SeriesCardProps {
  series: Series
}

function SeriesCard({ series }: SeriesCardProps) {
  const { t } = useTranslation()
  const { selectSeries } = useDataStore()
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

  return (
    <ParentCard
      itemKey={series.id}
      type="Shows"
      imgSrc={series.coverSrc}
      title={series.name}
      subtitle={'Not yet'}
      action={() => {
        selectSeries(series)
        navigate({
          to: '/details/series/$seriesId',
          params: { seriesId: series.id },
        })
      }}
      hidePlayButton
      cornerNumber={2}
      menuContent={menuContent}
      editModal={<></>}
      errorSrc="/img/fileNotFound.jpg"
    />
  )
}

export default SeriesCard
