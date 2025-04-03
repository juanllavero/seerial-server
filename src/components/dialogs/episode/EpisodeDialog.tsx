import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Episode } from '@/data/interfaces/Media'
import { showToast } from '@/utils/ReactUtils'
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
  const { selectedLibrary, selectedSeries, selectedSeason, updateEpisode } =
    useDataStore()
  const { episodeDialog, closeEpisodeDialog } = useDialogStore()
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
  const [episode, setEpisode] = useState<Episode | undefined>(
    episodeDialog.episodeToEdit,
  )
  //#endregion

  useEffect(() => {
    if (episodeDialog && episodeDialog.episodeToEdit) {
      setNameLock(episodeDialog.episodeToEdit.nameLock)
      setYearLock(episodeDialog.episodeToEdit.yearLock)
      setOverviewLock(episodeDialog.episodeToEdit.overviewLock)
      setDirectedLock(episodeDialog.episodeToEdit.directedLock)
      setWrittenLock(episodeDialog.episodeToEdit.writtenLock)
      setName(episodeDialog.episodeToEdit.name)
      setYear(episodeDialog.episodeToEdit.year)
      setOverview(episodeDialog.episodeToEdit.overview)
      setDirectedBy(episodeDialog.episodeToEdit.directedBy)
      setWrittenBy(episodeDialog.episodeToEdit.writtenBy)
      setImages(episodeDialog.episodeToEdit.imgUrls)
      setSelectedImage(episodeDialog.episodeToEdit.imgSrc)
      setEpisode(episodeDialog.episodeToEdit)
      setLocalFolder(`img/thumbnails/video/${episodeDialog.episodeToEdit.id}`)
      setSelectedTab(t('generalButton'))
    }
  }, [episodeDialog])

  if (!episode) return null

  const handleEditEpisode = async () => {
    if (!selectedLibrary || !selectedSeries) return

    await connectWS(serverIP)

    const response = await fetch(`https://${serverIP}/episode`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        libraryId: selectedLibrary.id,
        showId: selectedSeries.id,
        updatedEpisode: {
          ...episode,
          imgSrc: selectedImage,
          name: name,
          year: year,
          overview: overview,
          directedBy: directedBy,
          writtenBy: writtenBy,
          nameLock: nameLock,
          yearLock: yearLock,
          overviewLock: overviewLock,
          directedLock: directedLock,
          writtenLock: writtenLock,
        },
      }),
    })

    if (!response.ok) {
      showToast('error', 'Error updating episode')
      return
    }

    updateEpisode({
      libraryId: selectedLibrary.id,
      showId: selectedSeries.id,
      episode: {
        ...episode,
        imgSrc: selectedImage,
        name: name,
        year: year,
        overview: overview,
        directedBy: directedBy,
        writtenBy: writtenBy,
        nameLock: nameLock,
        yearLock: yearLock,
        overviewLock: overviewLock,
        directedLock: directedLock,
        writtenLock: writtenLock,
      },
    })

    closeEpisodeDialog()
  }

  const getWindowTitle = () => {
    if (!selectedLibrary || !selectedSeason || !selectedSeries)
      return `${t('editButton')} ${episode.name}`

    return `${t('editButton')} ${
      selectedLibrary && selectedLibrary.type === 'Shows'
        ? selectedSeries.name
        : selectedSeason.name
    } - ${episode.name} ${
      selectedLibrary &&
      selectedLibrary.type === 'Shows' &&
      `(${t('seasonLetter')}${episode.seasonNumber}${t('episodeLetter')}${episode.episodeNumber})`
    }`
  }

  return (
    <ModalWrapper
      title={getWindowTitle()}
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
              setNameLock={setNameLock}
              setYearLock={setYearLock}
              setOverviewLock={setOverviewLock}
              setDirectedLock={setDirectedLock}
              setWrittenLock={setWrittenLock}
              selectTab={setSelectedTab}
            />
          ),
        },
        {
          title: t('thumbnailsButton'),
          content: (
            <ImageListTab
              imagesList={images}
              localFolder={localFolder}
              selectImage={setSelectedImage}
              selectedImage={selectedImage}
            />
          ),
        },
        {
          title: t('details'),
          content: (
            <EpisodeMediaInfoTab episode={episode} setEpisode={setEpisode} />
          ),
        },
      ]}
      isOpen={episodeDialog.isOpen}
      close={closeEpisodeDialog}
      onAccept={handleEditEpisode}
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default EpisodeDialog
