import { ModalWrapper } from '@/components/ModalWrapper'
import { useDialogStore } from '@/context/dialog.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Collection } from '@/data/interfaces/Media'
import { authenticatedFetch } from '@/lib/auth'
import { ImageType } from '@/utils/constants'
import { showToast } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import ImageListTab from '../components/ImageListTab'
import CollectionInfoTab from './components/CollectionInfoTab'

function CollectionDialog() {
  const { t } = useTranslation()
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { collectionDialog, closeCollectionDialog } = useDialogStore(
    (state) => ({
      collectionDialog: state.collectionDialog,
      closeCollectionDialog: state.closeCollectionDialog,
    }),
    shallow,
  )
  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  const [collection, setCollection] = useState<Collection | undefined>(
    undefined,
  )

  // Covers
  const [covers, setCovers] = useState<string[]>([])
  const [localCoverFolder, setLocalCoverFolder] = useState<string>('')
  const [selectedCover, setSelectedCover] = useState<string>('')

  // Background
  const [backgrounds, setBackgrounds] = useState<string[]>([])
  const [localBackgroundFolder, setLocalBackgroundFolder] = useState<string>('')
  const [selectedBackground, setSelectedBackground] = useState<string>('')

  // Attributes
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')

  useEffect(() => {
    if (collectionDialog && collectionDialog.collectionToEdit) {
      setTitle(collectionDialog.collectionToEdit.title || '')
      setDescription(collectionDialog.collectionToEdit.description || '')

      setCollection(collectionDialog.collectionToEdit)
      setCovers(collectionDialog.collectionToEdit.coversUrls || [])
      setSelectedCover(collectionDialog.collectionToEdit.coverSrc || '')
      setLocalCoverFolder(`img/posters/${collectionDialog.collectionToEdit.id}`)
      setBackgrounds(collectionDialog.collectionToEdit.backgroundsUrls || [])
      setSelectedBackground(
        collectionDialog.collectionToEdit.backgroundSrc || '',
      )
      setLocalBackgroundFolder(
        `img/backgrounds/${collectionDialog.collectionToEdit.id}`,
      )
      setSelectedTab(t('generalButton'))
    }
  }, [collectionDialog])

  if (!collection) return null

  const handleEditCollection = async () => {
    await connectWS()

    const response = await authenticatedFetch(
      `/api/collection/${collection.id}`,
      'PUT',
      {
        ...collection,
        title,
        description,
        posterSrc: selectedCover,
        backgroundSrc: selectedBackground,
      },
    )

    if (!response || !response.ok) {
      showToast('error', 'Error updating episode')
      return
    }

    mutate((key: string) => key.startsWith(`/api/details/season`))

    closeCollectionDialog()
  }

  const getWindowTitle = () => {
    return `${t('editButton')} ${collection.title}`
  }

  return (
    <ModalWrapper
      title={getWindowTitle()}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <CollectionInfoTab
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
            />
          ),
        },
        {
          title: t('postersButton'),
          content: (
            <ImageListTab
              type={ImageType.POSTER}
              imagesList={covers}
              localFolder={localCoverFolder}
              selectImage={setSelectedCover}
              selectedImage={selectedCover}
            />
          ),
        },
        {
          title: t('backgroundsButton'),
          content: (
            <ImageListTab
              imagesList={backgrounds}
              localFolder={localBackgroundFolder}
              selectImage={setSelectedBackground}
              selectedImage={selectedBackground}
            />
          ),
        },
      ]}
      width="50rem"
      isOpen={collectionDialog.isOpen}
      close={closeCollectionDialog}
      onAccept={handleEditCollection}
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default CollectionDialog
