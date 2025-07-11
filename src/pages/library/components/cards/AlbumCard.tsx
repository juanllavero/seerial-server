import { Button } from '@/components/ui/button'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { Album } from '@/data/interfaces/Music'
import { DropdownContent } from '@/data/interfaces/Utils'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ParentCard from './ParentCard'
import { useEffect, useState } from 'react'
import { shallow } from 'zustand/shallow'

interface AlbumCardProps {
  album: Album
}

function AlbumCard({ album }: AlbumCardProps) {
  const { t } = useTranslation()
  const selectAlbum = useDataStore((state) => state.selectAlbum)
  const { selectedServer, serverUrl } = useServerStore(
    (state) => ({
      selectedServer: state.selectedServer,
      serverUrl: state.serverUrl,
    }),
    shallow,
  )
  const openAlbumDialog = useDialogStore((state) => state.openAlbumDialog)
  const [hasDolbyAtmos, setHasDolbyAtmos] = useState<boolean>(false)
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

  useEffect(() => {
    const getDolbyAtmosState = async () => {
      const res = await fetch(`${serverUrl}/hasDolbyAtmos?albumId=${album.id}`)
      const data = await res.json()
      setHasDolbyAtmos(data.hasDolbyAtmos)
    }

    if (selectedServer) getDolbyAtmosState()
  }, [selectedServer])

  return (
    <ParentCard
      itemKey={album.id}
      type="Music"
      imgSrc={album.coverSrc}
      title={album.title}
      subtitle={album.year ?? '-'}
      hasDolbyAtmos={hasDolbyAtmos}
      action={() => {
        selectAlbum(album.id)
        navigate(`/server/${selectedServer?.id}/details/album/${album.id}`)
      }}
      hidePlayButton
      menuContent={menuContent}
      editModal={
        <Button
          variant={'ghost'}
          size={'icon'}
          onClick={(e) => {
            e.stopPropagation()
            openAlbumDialog(album)
          }}
        >
          <Pencil size={16} />
        </Button>
      }
      errorSrc="/img/songDefault.png"
    />
  )
}

export default AlbumCard
