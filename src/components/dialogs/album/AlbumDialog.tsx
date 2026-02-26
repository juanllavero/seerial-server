import { ModalWrapper } from '@/components/ModalWrapper'
import { API, authenticatedFetch } from '@/config/api'
import { useDialogStore } from '@/context/dialog.store'
import { useWebSocketStore } from '@/context/ws.context'
import { Album } from '@/data/interfaces/Music'
import { ImageType } from '@/utils/constants'
import { showToast } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import ImageListTab from '../components/ImageListTab'
import AlbumInfoTab from './components/AlbumInfoTab'

function AlbumDialog() {
  const { t } = useTranslation()
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { albumDialog, closeAlbumDialog } = useDialogStore(
    (state) => ({
      albumDialog: state.albumDialog,
      closeAlbumDialog: state.closeAlbumDialog,
    }),
    shallow,
  )
  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  // Posters
  const [posters, setPosters] = useState<string[]>([])
  const [localPosterFolder, setLocalPosterFolder] = useState<string>('')
  const [selectedPoster, setSelectedPoster] = useState<string>('')

  //#region ATTRIBUTES
  const [title, setTitle] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [genres, setGenres] = useState<string[]>([''])

  const [album, setAlbum] = useState<Album | undefined>(undefined)
  //#endregion

  useEffect(() => {
    if (albumDialog && albumDialog.albumToEdit) {
      setTitle(albumDialog.albumToEdit.title || '')
      setYear(albumDialog.albumToEdit.year || '')
      setDescription(albumDialog.albumToEdit.description || '')
      setGenres(albumDialog.albumToEdit.genres || [])

      setAlbum(albumDialog.albumToEdit)
      setPosters([])
      setSelectedPoster(albumDialog.albumToEdit.coverSrc || '')
      setLocalPosterFolder(`img/posters/${albumDialog.albumToEdit.id}`)
      setSelectedTab(t('generalButton'))
    }
  }, [albumDialog])

  if (!album) return null

  const handleEditAlbum = async () => {
    await connectWS()

    const response = await authenticatedFetch(
      API.albums.update(album.id),
      'PUT',
      {
        ...album,
        title: title,
        year: year,
        description: description,
        coverSrc: selectedPoster ?? '',
        genres: genres,
      },
    )

    if (!response || !response.data) {
      showToast('error', 'Error updating episode')
      return
    }

    mutate((key: string) => key.startsWith(API.albums.get(album.id)))

    closeAlbumDialog()
  }

  const getWindowTitle = () => {
    return `${t('editButton')} ${album.title}`
  }

  return (
    <ModalWrapper
      title={getWindowTitle()}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <AlbumInfoTab
              title={title}
              setTitle={setTitle}
              year={year}
              setYear={setYear}
              description={description}
              setDescription={setDescription}
              genres={genres}
              setGenres={setGenres}
            />
          ),
        },
        {
          title: t('postersButton'),
          content: (
            <ImageListTab
              imagesList={posters}
              localFolder={localPosterFolder}
              selectImage={setSelectedPoster}
              selectedImage={selectedPoster}
              type={ImageType.SQUARE}
            />
          ),
        },
      ]}
      width="50rem"
      isOpen={albumDialog.isOpen}
      close={closeAlbumDialog}
      onAccept={handleEditAlbum}
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default AlbumDialog
