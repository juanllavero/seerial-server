import { Button } from '@/components/ui/button'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { Collection, CollectionImages } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ParentCard from './ParentCard'
import Image from '@/components/ui/Image'
import { getPosterImage, getFirstImage } from '@/utils/ReactUtils'
import useSWR from 'swr'
import { fetcher } from '@/utils/utils'
import { shallow } from 'zustand/shallow'

interface CollectionCardProps {
  libraryId: string
  collection: Collection
  type: string
}

function CollectionCard({ libraryId, collection, type }: CollectionCardProps) {
  const { t } = useTranslation()
  const { selectCollection, setCurrentBackground } = useDataStore(
    (state) => ({
      selectCollection: state.selectCollection,
      setCurrentBackground: state.setCurrentBackground,
    }),
    shallow,
  )
  const { selectedServer, serverUrl } = useServerStore(
    (state) => ({
      selectedServer: state.selectedServer,
      serverUrl: state.serverUrl,
    }),
    shallow,
  )
  const openCollectionDialog = useDialogStore(
    (state) => state.openCollectionDialog,
  )
  const navigate = useNavigate()

  const { data: collectionImages } = useSWR<CollectionImages>(
    `${serverUrl}/collection-images?collectionId=${collection.id}&&type=${type}`,
    fetcher,
  )

  useEffect(() => {
    if (collectionImages && collectionImages.background) {
      setCurrentBackground(
        collection.backgroundSrc !== ''
          ? collection.backgroundSrc
          : collectionImages.background,
      )
    }
  }, [collectionImages])

  const menuContent: DropdownContent = {
    items: [
      {
        separator: false,
        items: [
          // {
          //   title: t('updateMetadata'),
          //   action: () => console.log('Profile clicked'),
          // },
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

  const posterImage =
    collectionImages &&
    collectionImages.images &&
    collectionImages.images.length > 1
      ? getPosterImage(
          collection.id,
          collectionImages && collectionImages.images
            ? collectionImages.images
            : [],
          type,
        )
      : undefined

  return (
    <ParentCard
      itemKey={collection.id}
      type={type}
      imgSrc={
        collection.coverSrc && collection.coverSrc !== ''
          ? collection.coverSrc
          : collectionImages &&
              collectionImages.poster &&
              collectionImages.poster !== ''
            ? collectionImages.poster
            : collectionImages &&
                collectionImages.images &&
                collectionImages.images.length > 0
              ? collectionImages.images[0]
              : type === 'Music'
                ? '/img/songDefault.png'
                : '/img/fileNotFound.jpg'
      }
      collageComponent={posterImage}
      title={collection.title}
      subtitle={`${collection.numberOfItems ?? 0} ${t('elements')}`}
      action={() => {
        selectCollection(collection.id)
        navigate(
          `/server/${selectedServer?.id}/details/collection/${collection.id}/${type}`,
        )
      }}
      hidePlayButton
      menuContent={menuContent}
      editModal={
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
      }
      errorSrc={
        type === 'Music' ? '/img/songDefault.png' : '/img/fileNotFound.jpg'
      }
    />
  )
}

export default CollectionCard
