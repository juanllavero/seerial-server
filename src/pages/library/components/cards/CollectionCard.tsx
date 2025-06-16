import { Button } from '@/components/ui/button'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { Collection } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ParentCard from './ParentCard'

interface CollectionCardProps {
  collection: Collection
  type: string
}

function CollectionCard({ collection, type }: CollectionCardProps) {
  const { t } = useTranslation()
  const { selectCollection } = useDataStore()
  const { selectedServer } = useServerStore()
  const { openCollectionDialog } = useDialogStore()
  const [subtitleText, setSubtitleText] = useState<string>('')
  const navigate = useNavigate()

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

  useEffect(() => {
    if (
      type === 'Movies' &&
      collection.movies &&
      collection.movies.length > 0
    ) {
      let text = collection.movies.length > 1 ? t('movies') : t('movie')
      setSubtitleText(`${collection.movies.length} ${text}`)
    } else if (
      type === 'Series' &&
      collection.shows &&
      collection.shows.length > 0
    ) {
      let text = collection.shows.length > 1 ? t('shows') : t('show')
      setSubtitleText(`${collection.shows.length} ${text}`)
    } else if (
      type === 'Music' &&
      collection.albums &&
      collection.albums.length > 0
    ) {
      let text = collection.albums.length > 1 ? t('albums') : t('album')
      setSubtitleText(`${collection.albums.length} ${text}`)
    } else {
      setSubtitleText('')
    }
  }, [])

  return (
    <ParentCard
      itemKey={collection.id}
      type={type}
      imgSrc={collection.coverSrc}
      title={collection.title}
      subtitle={subtitleText}
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
