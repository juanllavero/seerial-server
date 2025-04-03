import { ModalWrapper } from '@/components/ModalWrapper'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Season } from '@/data/interfaces/Media'
import { showToast } from '@/utils/ReactUtils'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ImageListTab from '../components/ImageListTab'
import SeasonInfoTab from './components/SeasonInfoTab'
import SeasonMediaTab from './components/SeasonMediaTab'
import SeasonTagsTab from './components/SeasonTagsTab'

function SeasonDialog() {
  const { t } = useTranslation()
  const { serverIP } = useServerStore()
  const { connectWS } = useWebSocketStore()
  const { selectedLibrary, selectedSeries, updateSeason } = useDataStore()
  const { seasonDialog, closeSeasonDialog } = useDialogStore()
  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  // Logos
  const [logos, setLogos] = useState<string[]>([])
  const [localLogoFolder, setLocalLogoFolder] = useState<string>('')
  const [selectedLogo, setSelectedLogo] = useState<string>('')

  // Background
  const [backgrounds, setBackgrounds] = useState<string[]>([])
  const [localBackgroundFolder, setLocalBackgroundFolder] = useState<string>('')
  const [selectedBackground, setSelectedBackground] = useState<string>('')

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
  const [directedByLock, setDirectedByLock] = useState<boolean>(false)
  const [writtenByLock, setWrittenByLock] = useState<boolean>(false)

  const [name, setName] = useState<string>('')
  const [order, setOrder] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [overview, setOverview] = useState<string>('')
  const [tagline, setTagline] = useState<string>('')
  const [studios, setStudios] = useState<string[]>([''])
  const [genres, setGenres] = useState<string[]>([''])
  const [creator, setCreator] = useState<string[]>([''])
  const [music, setMusic] = useState<string[]>([''])
  const [directedBy, setDirectedBy] = useState<string[]>([''])
  const [writtenBy, setWrittenBy] = useState<string[]>([''])
  const [videoSrc, setVideoSrc] = useState<string>('')
  const [musicSrc, setMusicSrc] = useState<string>('')
  const [extVideoSrc, setExtVideoSrc] = useState<string>('')
  const [extMusicSrc, setExtMusicSrc] = useState<string>('')
  const [season, setSeason] = useState<Season | undefined>(
    seasonDialog.seasonToEdit,
  )
  //#endregion

  useEffect(() => {
    if (seasonDialog && seasonDialog.seasonToEdit) {
      setNameLock(seasonDialog.seasonToEdit.nameLock || false)
      setYearLock(seasonDialog.seasonToEdit.yearLock || false)
      setOverviewLock(seasonDialog.seasonToEdit.overviewLock || false)
      setTaglineLock(seasonDialog.seasonToEdit.taglineLock || false)
      setStudiosLock(seasonDialog.seasonToEdit.studioLock || false)
      setGenresLock(seasonDialog.seasonToEdit.genresLock || false)
      setCreatorLock(seasonDialog.seasonToEdit.creatorLock || false)
      setMusicLock(seasonDialog.seasonToEdit.musicLock || false)
      setDirectedByLock(seasonDialog.seasonToEdit.directedLock || false)
      setWrittenByLock(seasonDialog.seasonToEdit.writtenLock || false)
      setName(seasonDialog.seasonToEdit.name)
      setYear(seasonDialog.seasonToEdit.year)
      setOrder(seasonDialog.seasonToEdit.order.toString())
      setOverview(seasonDialog.seasonToEdit.overview)
      setTagline(seasonDialog.seasonToEdit.tagline)
      setStudios(seasonDialog.seasonToEdit.productionStudios || [])
      setGenres(seasonDialog.seasonToEdit.genres || [])
      setCreator(seasonDialog.seasonToEdit.creator || [])
      setMusic(seasonDialog.seasonToEdit.musicComposer || [])
      setDirectedBy(seasonDialog.seasonToEdit.directedBy || [])
      setWrittenBy(seasonDialog.seasonToEdit.writtenBy || [])

      setSeason(seasonDialog.seasonToEdit)
      setLogos(seasonDialog.seasonToEdit.logosUrls || [])
      setBackgrounds(seasonDialog.seasonToEdit.backgroundsUrls || [])
      setPosters(seasonDialog.seasonToEdit.coversUrls || [])
      setSelectedLogo(seasonDialog.seasonToEdit.logoSrc || '')
      setSelectedPoster(seasonDialog.seasonToEdit.coverSrc || '')
      setSelectedBackground(seasonDialog.seasonToEdit.backgroundSrc || '')
      setLocalLogoFolder(`img/logos/${seasonDialog.seasonToEdit.id}`)
      setLocalBackgroundFolder(
        `img/backgrounds/${seasonDialog.seasonToEdit.id}`,
      )
      setLocalPosterFolder(`img/posters/${seasonDialog.seasonToEdit.id}`)
      setSelectedTab(t('generalButton'))
    }
  }, [seasonDialog])

  if (!season) return null

  const handleEditSeason = async () => {
    if (!selectedLibrary || !selectedSeries) return

    await connectWS(serverIP)

    const response = await fetch(`https://${serverIP}/season`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        libraryId: selectedLibrary.id,
        showId: selectedSeries.id,
        updatedSeason: {
          ...season,
          name: name,
          year: year,
          overview: overview,
          directedBy: directedBy,
          writtenBy: writtenBy,
          nameLock: nameLock,
          yearLock: yearLock,
          overviewLock: overviewLock,
        },
      }),
    })

    if (!response.ok) {
      showToast('error', 'Error updating episode')
      return
    }

    updateSeason({
      ...season,
      name: name,
      year: year,
      overview: overview,
      directedBy: directedBy,
      writtenBy: writtenBy,
      nameLock: nameLock,
      yearLock: yearLock,
      overviewLock: overviewLock,
    })

    closeSeasonDialog()
  }

  const getWindowTitle = () => {
    if (!selectedLibrary || !selectedSeries)
      return `${t('editButton')} ${season.name}`

    return `${t('editButton')} ${
      selectedLibrary && selectedLibrary.type === 'Shows'
        ? selectedSeries.name
        : season.name
    }`
  }

  return (
    <ModalWrapper
      title={getWindowTitle()}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <SeasonInfoTab
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
              genres={genres}
              setGenres={setGenres}
              genresLock={genresLock}
              setGenresLock={setGenresLock}
            />
          ),
        },
        {
          title: t('tags'),
          content: (
            <SeasonTagsTab
              genres={genres}
              setGenres={setGenres}
              creator={creator}
              setCreator={setCreator}
              directedBy={directedBy}
              setDirectedBy={setDirectedBy}
              writtenBy={writtenBy}
              setWrittenBy={setWrittenBy}
              music={music}
              setMusic={setMusic}
            />
          ),
          hidden: selectedLibrary?.type !== 'Movies',
        },
        {
          title: t('media'),
          content: <SeasonMediaTab />,
          hidden: selectedLibrary?.type === 'Music',
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
          hidden: selectedLibrary?.type !== 'Movies',
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
          hidden: selectedLibrary?.type === 'Music',
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
          hidden: selectedLibrary?.type === 'Shows',
        },
      ]}
      isOpen={seasonDialog.isOpen}
      close={closeSeasonDialog}
      onAccept={handleEditSeason}
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default SeasonDialog
