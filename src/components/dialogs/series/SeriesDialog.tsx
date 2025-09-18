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
import { ImageType } from '@/utils/constants'
import { authenticatedFetch } from '@/lib/auth'

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
  const [yearLock, setYearLock] = useState<boolean>(false)
  const [overviewLock, setOverviewLock] = useState<boolean>(false)
  const [taglineLock, setTaglineLock] = useState<boolean>(false)
  const [studiosLock, setStudiosLock] = useState<boolean>(false)
  const [genresLock, setGenresLock] = useState<boolean>(false)
  const [creatorLock, setCreatorLock] = useState<boolean>(false)
  const [musicLock, setMusicLock] = useState<boolean>(false)

  const [name, setName] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [overview, setOverview] = useState<string>('')
  const [tagline, setTagline] = useState<string>('')
  const [studios, setStudios] = useState<string[]>([''])
  const [genres, setGenres] = useState<string[]>([''])
  const [creator, setCreator] = useState<string[]>([''])
  const [music, setMusic] = useState<string[]>([''])
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
      setOverview(seriesDialog.seriesToEdit.overview)
      setTagline(seriesDialog.seriesToEdit.tagline || '')
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

    const response = await authenticatedFetch(
      `${serverUrl}/show/${series.id}`,
      'PUT',
      {
        ...series,
        name: name,
        year: year,
        overview: overview,
        tagline: tagline,
        productionStudios: studios,
        genres: genres,
        creator: creator,
        musicComposer: music,
        nameLock: nameLock,
        yearLock: yearLock,
        overviewLock: overviewLock,
        taglineLock: taglineLock,
        productionStudiosLock: studiosLock,
        genresLock: genresLock,
        creatorLock: creatorLock,
        musicComposerLock: musicLock,
        logoSrc: selectedLogo ?? series.logoSrc,
        coverSrc: selectedPoster ?? series.coverSrc,
      },
    )

    if (!response || !response.ok) {
      showToast('error', 'Error updating series')
      return
    }

    mutate((key: string) => key.startsWith(`${serverUrl}/details/series`))
    mutate((key: string) => key.startsWith(`${serverUrl}/library-content`))

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
              genresLock={genresLock}
              setGenresLock={setGenresLock}
              studiosLock={studiosLock}
              setStudiosLock={setStudiosLock}
              creatorLock={creatorLock}
              setCreatorLock={setCreatorLock}
              musicLock={musicLock}
              setMusicLock={setMusicLock}
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
              type={ImageType.LOGO}
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
              type={ImageType.POSTER}
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
