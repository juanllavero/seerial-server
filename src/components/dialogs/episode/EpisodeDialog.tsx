import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Episode } from '@/data/interfaces/Media'
import { authenticatedFetch, authenticatedFetcher } from '@/lib/auth'
import { showToast } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import { ModalWrapper } from '../../ModalWrapper'
import ImageListTab from '../components/ImageListTab'
import EpisodeInfoTab from './components/EpisodeInfoTab'
import EpisodeMediaInfoTab from './components/EpisodeMediaInfoTab'

function EpisodeDialog() {
  const { t } = useTranslation()
  const serverUrl = useServerStore((state) => state.serverUrl)
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { episodeDialog, closeEpisodeDialog } = useDialogStore(
    (state) => ({
      episodeDialog: state.episodeDialog,
      closeEpisodeDialog: state.closeEpisodeDialog,
    }),
    shallow,
  )
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

  const { data: series } = useSWR(
    episode && serverUrl !== ''
      ? `${serverUrl}/details/seriesBySeasonId?id=${episode.seasonId}`
      : null,
    authenticatedFetcher,
  )

  useEffect(() => {
    if (episodeDialog && episodeDialog.episodeToEdit) {
      setNameLock(episodeDialog.episodeToEdit.nameLock)
      setYearLock(episodeDialog.episodeToEdit.yearLock)
      setOverviewLock(episodeDialog.episodeToEdit.overviewLock)
      setName(episodeDialog.episodeToEdit.name)
      setYear(episodeDialog.episodeToEdit.year)
      setOverview(episodeDialog.episodeToEdit.overview)
      setDirectedBy(episodeDialog.episodeToEdit.directedBy)
      setWrittenBy(episodeDialog.episodeToEdit.writtenBy)
      setEpisode(episodeDialog.episodeToEdit)
      setImages(episodeDialog.episodeToEdit.video.imgUrls || [])
      setSelectedImage(episodeDialog.episodeToEdit.video.imgSrc || '')
      setLocalFolder(`img/thumbnails/video/${episodeDialog.episodeToEdit.id}`)
      setSelectedTab(t('generalButton'))
    }
  }, [episodeDialog])

  if (!episode || !series) return null

  const handleEditEpisode = async () => {
    if (serverUrl === '') return

    await connectWS(serverUrl)

    const response = await authenticatedFetch(
      `${serverUrl}/episode/${episode.id}`,
      'PUT',
      {
        ...episode,
        imgSrc: selectedImage ?? episode.video.imgSrc,
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
    )

    if (!response || !response.ok) {
      showToast('error', 'Error updating episode')
      return
    }

    mutate((key: string) => key.startsWith(`${serverUrl}/details/season`))
    mutate((key: string) => key.startsWith(`${serverUrl}/details/episode`))

    closeEpisodeDialog()
  }

  const getWindowTitle = () => {
    return `${t('editButton')} ${series.name} - ${episode.name} ${`(${t('seasonLetter')}${episode.seasonNumber}${t('episodeLetter')}${episode.episodeNumber})`}`
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
          content: <EpisodeMediaInfoTab video={episode.video} />,
        },
      ]}
      width="50rem"
      isOpen={episodeDialog.isOpen}
      close={closeEpisodeDialog}
      onAccept={handleEditEpisode}
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default EpisodeDialog
