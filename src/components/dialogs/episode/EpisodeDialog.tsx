import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalWrapper } from '../../ModalWrapper'
import ImageListTab from '../components/ImageListTab'
import EpisodeInfoTab from './components/EpisodeInfoTab'
import EpisodeMediaInfoTab from './components/EpisodeMediaInfoTab'

function EpisodeDialog() {
  const { t } = useTranslation()
  const { serverIP } = useServerStore()
  const { connectWS } = useWebSocketStore()
  const { episodeDialog, closeEpisodeDialog, openEpisodeDialog } =
    useDialogStore()
  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  const [images, setImages] = useState<string[]>([])
  const [localFolder, setLocalFolder] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string>('')

  //#region ATTRIBUTES
  const [nameLock, setNameLock] = useState<boolean>(false)
  const [yearLock, setYearLock] = useState<boolean>(false)
  const [overviewLock, setOverviewLock] = useState<boolean>(false)
  const [directedLock, setDirectedLock] = useState<boolean>(false)
  const [writtenLock, setWrittenLock] = useState<boolean>(false)

  const [name, setName] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [overview, setOverview] = useState<string>('')
  const [directedBy, setDirectedBy] = useState<string[]>([])
  const [writtenBy, setWrittenBy] = useState<string[]>([])
  //#endregion

  const episode = episodeDialog.episodeToEdit

  useEffect(() => {
    console.log({ episode })
    if (episodeDialog && episode) {
      console.log('AAAA')
      setNameLock(episode.nameLock)
      setYearLock(episode.yearLock)
      setOverviewLock(episode.overviewLock)
      setDirectedLock(episode.directedLock)
      setWrittenLock(episode.writtenLock)
      setName(episode.name)
      setYear(episode.year)
      setOverview(episode.overview)
      setDirectedBy(episode.directedBy)
      setWrittenBy(episode.writtenBy)
      setImages(episode.imgUrls)
      setSelectedImage(episode.imgSrc)
      setSelectedTab(t('generalButton'))
    }
  }, [episodeDialog])

  if (!episode) return null

  const handleEditEpisode = async () => {
    await connectWS(serverIP)

    fetch(`https://${serverIP}/episode/${episode.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        episode: episode,
      }),
    })

    closeEpisodeDialog()
  }

  return (
    <ModalWrapper
      title={t('episodeWindowTitle')}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <EpisodeInfoTab
              name={name}
              setName={setName}
              year={year}
              setYear={setYear}
              overview={overview}
              setOverview={setOverview}
              directedBy={directedBy}
              setDirectedBy={setDirectedBy}
              writtenBy={writtenBy}
              setWrittenBy={setWrittenBy}
              nameLock={nameLock}
              yearLock={yearLock}
              overviewLock={overviewLock}
              directedLock={directedLock}
              writtenLock={writtenLock}
              selectTab={setSelectedTab}
              close={closeEpisodeDialog}
            />
          ),
        },
        {
          title: t('thumbnails'),
          content: (
            <ImageListTab
              imagesList={images}
              localFolder={localFolder}
              selectImage={setSelectedImage}
              close={closeEpisodeDialog}
              handleAccept={handleEditEpisode}
            />
          ),
        },
        {
          title: t('details'),
          content: (
            <EpisodeMediaInfoTab
              episode={episode}
              close={closeEpisodeDialog}
              handleAccept={handleEditEpisode}
            />
          ),
        },
      ]}
      isOpen={episodeDialog.isOpen}
      close={closeEpisodeDialog}
      hideButtons
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default EpisodeDialog
