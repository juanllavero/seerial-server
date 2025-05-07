import useDataStore from '@/context/data.context'
import { Collection } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import { useNavigate } from '@tanstack/react-router'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ParentCard from './ParentCard'

interface CollectionCardProps {
  collection: Collection
  type: string
}

function CollectionCard({ collection, type }: CollectionCardProps) {
  const { t } = useTranslation()
  const { selectCollection } = useDataStore()
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
      itemKey={collection.id}
      type={type}
      imgSrc={collection.coverSrc}
      title={collection.title}
      subtitle={'Not yet'}
      action={() => {
        selectCollection(collection)
        navigate({
          to: '/details/collection/$collectionId',
          params: { collectionId: collection.id },
        })
      }}
      hidePlayButton
      cornerNumber={2}
      menuContent={menuContent}
      editModal={<></>}
      errorSrc={
        type === 'Music' ? '/img/songDefault.png' : '/img/fileNotFound.jpg'
      }
    />
  )
}

export default CollectionCard
