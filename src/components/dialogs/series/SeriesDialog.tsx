import { ModalWrapper } from '@/components/ModalWrapper'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Series } from '@/data/interfaces/Media'
import { showToast } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mutate } from 'swr'
import ImageListTab from '../components/ImageListTab'
import SeriesInfoTab from './components/SeriesInfoTab'
import SeriesTagsTab from './components/SeriesTagsTab'
import { shallow } from 'zustand/shallow'
import MediaTab from '../MediaTab'

function SeriesDialog() {
  const { t } = useTranslation()
  const serverUrl = useServerStore((state) => state.serverUrl)
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { seriesDialog, closeSeriesDialog } = useDialogStore(
    (state) => ({
      seriesDialog: state.seriesDialog,
      closeSeriesDialog: state.closeSeriesDialog,
    }),
    shallow,
  )
  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  const [series, setSeries] = useState<Series | undefined>(undefined)

  // Logos
  const [logos, setLogos] = useState<string[]>([])
  const [localLogoFolder, setLocalLogoFolder] = useState<string>('')
  const [selectedLogo, setSelectedLogo] = useState<string>('')

  // Posters
  const [posters, setPosters] = useState<string[]>([])
  const [localPosterFolder, setLocalPosterFolder] = useState<string>('')
  const [selectedPoster, setSelectedPoster] = useState<string>('')

  //#region ATTRIBUTES
  const [nameLock, setNameLock] = useState<boolean>(false)
  const [orderLock, setOrderLock] = useState<boolean>(false)
  const [yearLock, setYearLock] = useState<boolean>(false)
  const [overviewLock, setOverviewLock] = useState<boolean>(false)
  const [taglineLock, setTaglineLock] = useState<boolean>(false)
  const [studiosLock, setStudiosLock] = useState<boolean>(false)
  const [genresLock, setGenresLock] = useState<boolean>(false)
  const [creatorLock, setCreatorLock] = useState<boolean>(false)
  const [musicLock, setMusicLock] = useState<boolean>(false)

  const [name, setName] = useState<string>('')
  const [order, setOrder] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [overview, setOverview] = useState<string>('')
  const [tagline, setTagline] = useState<string>('')
  const [studios, setStudios] = useState<string[]>([''])
  const [genres, setGenres] = useState<string[]>([''])
  const [creator, setCreator] = useState<string[]>([''])
  const [music, setMusic] = useState<string[]>([''])
  const [videoSrc, setVideoSrc] = useState<string>('')
  const [musicSrc, setMusicSrc] = useState<string>('')
  const [extVideoSrc, setExtVideoSrc] = useState<string>('')
  const [extMusicSrc, setExtMusicSrc] = useState<string>('')
  //#endregion

  useEffect(() => {
    if (seriesDialog && seriesDialog.seriesToEdit) {
      setNameLock(seriesDialog.seriesToEdit.nameLock || false)
      setYearLock(seriesDialog.seriesToEdit.yearLock || false)
      setOverviewLock(seriesDialog.seriesToEdit.overviewLock || false)
      setTaglineLock(seriesDialog.seriesToEdit.taglineLock || false)
      setStudiosLock(seriesDialog.seriesToEdit.productionStudiosLock || false)
      setGenresLock(seriesDialog.seriesToEdit.genresLock || false)
      setCreatorLock(seriesDialog.seriesToEdit.creatorLock || false)
      setMusicLock(seriesDialog.seriesToEdit.musicComposerLock || false)
      setName(seriesDialog.seriesToEdit.name)
      setYear(seriesDialog.seriesToEdit.year)
      setOrder(seriesDialog.seriesToEdit.order.toString())
      setOverview(seriesDialog.seriesToEdit.overview)
      setTagline(seriesDialog.seriesToEdit.tagline)
      setStudios(seriesDialog.seriesToEdit.productionStudios || [])
      setGenres(seriesDialog.seriesToEdit.genres || [])
      setCreator(seriesDialog.seriesToEdit.creator || [])
      setMusic(seriesDialog.seriesToEdit.musicComposer || [])

      setSeries(seriesDialog.seriesToEdit)
      setLogos(seriesDialog.seriesToEdit.logosUrls || [])
      setPosters(seriesDialog.seriesToEdit.coversUrls || [])
      setSelectedLogo(seriesDialog.seriesToEdit.logoSrc || '')
      setSelectedPoster(seriesDialog.seriesToEdit.coverSrc || '')
      setLocalLogoFolder(`img/logos/${seriesDialog.seriesToEdit.id}`)
      setLocalPosterFolder(`img/posters/${seriesDialog.seriesToEdit.id}`)
      setSelectedTab(t('generalButton'))
    }
  }, [seriesDialog])

  if (!series) return null

  const handleEditMovie = async () => {
    if (serverUrl === '') return

    await connectWS(serverUrl)

    const response = await fetch(`${serverUrl}/series`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updatedMovie: {
          ...series,
          name: name,
          year: year,
          overview: overview,
          studios: studios,
          nameLock: nameLock,
          yearLock: yearLock,
          overviewLock: overviewLock,
        },
      }),
    })

    if (!response.ok) {
      showToast('error', 'Error updating series')
      return
    }

    mutate((key: string) => key.startsWith(`${serverUrl}/details/series`))

    closeSeriesDialog()
  }

  const getWindowTitle = () => {
    return `${t('editButton')} ${series.name}`
  }

  return (
    <ModalWrapper
      title={getWindowTitle()}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <SeriesInfoTab
              name={name}
              setName={setName}
              year={year}
              setYear={setYear}
              overview={overview}
              setOverview={setOverview}
              nameLock={nameLock}
              yearLock={yearLock}
              overviewLock={overviewLock}
              setNameLock={setNameLock}
              setYearLock={setYearLock}
              setOverviewLock={setOverviewLock}
              order={order}
              setOrder={setOrder}
              orderLock={orderLock}
              setOrderLock={setOrderLock}
              studios={studios}
              setStudios={setStudios}
              studiosLock={studiosLock}
              setStudiosLock={setStudiosLock}
              tagline={tagline}
              setTagline={setTagline}
              taglineLock={taglineLock}
              setTaglineLock={setTaglineLock}
            />
          ),
        },
        {
          title: t('tags'),
          content: (
            <SeriesTagsTab
              genres={genres}
              setGenres={setGenres}
              creator={creator}
              setCreator={setCreator}
              studios={studios}
              setStudios={setStudios}
              music={music}
              setMusic={setMusic}
            />
          ),
        },
        {
          title: t('media'),
          content: <MediaTab series={series} />,
        },
        {
          title: t('logosButton'),
          content: (
            <ImageListTab
              imagesList={logos}
              localFolder={localLogoFolder}
              selectImage={setSelectedLogo}
              selectedImage={selectedLogo}
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
              isPoster
            />
          ),
        },
      ]}
      width="50rem"
      isOpen={seriesDialog.isOpen}
      close={closeSeriesDialog}
      onAccept={handleEditMovie}
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default SeriesDialog
