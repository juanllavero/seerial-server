import { ModalWrapper } from '@/components/ModalWrapper'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Movie } from '@/data/interfaces/Media'
import { showToast } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mutate } from 'swr'
import ImageListTab from '../components/ImageListTab'
import MovieInfoTab from './components/MovieInfoTab'
import MediaTab from '../MediaTab'
import MovieTagsTab from './components/MovieTagsTab'
import { shallow } from 'zustand/shallow'
import { ImageType } from '@/utils/constants'
import { authenticatedFetch } from '@/lib/auth'
import { t } from 'i18next'

function MovieDialog() {
  const { t } = useTranslation()
  const serverUrl = useServerStore((state) => state.serverUrl)
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { movieDialog, closeMovieDialog } = useDialogStore(
    (state) => ({
      movieDialog: state.movieDialog,
      closeMovieDialog: state.closeMovieDialog,
    }),
    shallow,
  )
  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  const [movie, setMovie] = useState<Movie | undefined>(undefined)

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
  const [year, setYear] = useState<string>('')
  const [overview, setOverview] = useState<string>('')
  const [tagline, setTagline] = useState<string>('')
  const [studios, setStudios] = useState<string[]>([''])
  const [genres, setGenres] = useState<string[]>([''])
  const [creator, setCreator] = useState<string[]>([''])
  const [music, setMusic] = useState<string[]>([''])
  const [directedBy, setDirectedBy] = useState<string[]>([''])
  const [writtenBy, setWrittenBy] = useState<string[]>([''])
  //#endregion

  useEffect(() => {
    if (movieDialog && movieDialog.movieToEdit) {
      setNameLock(movieDialog.movieToEdit.nameLock || false)
      setYearLock(movieDialog.movieToEdit.yearLock || false)
      setOverviewLock(movieDialog.movieToEdit.overviewLock || false)
      setTaglineLock(movieDialog.movieToEdit.taglineLock || false)
      setStudiosLock(movieDialog.movieToEdit.productionStudiosLock || false)
      setGenresLock(movieDialog.movieToEdit.genresLock || false)
      setCreatorLock(movieDialog.movieToEdit.creatorLock || false)
      setMusicLock(movieDialog.movieToEdit.musicComposerLock || false)
      setDirectedByLock(movieDialog.movieToEdit.directedByLock || false)
      setWrittenByLock(movieDialog.movieToEdit.writtenByLock || false)
      setName(movieDialog.movieToEdit.name)
      setYear(movieDialog.movieToEdit.year)
      setOverview(movieDialog.movieToEdit.overview)
      setTagline(movieDialog.movieToEdit.tagline)
      setStudios(movieDialog.movieToEdit.productionStudios || [])
      setGenres(movieDialog.movieToEdit.genres || [])
      setCreator(movieDialog.movieToEdit.creator || [])
      setMusic(movieDialog.movieToEdit.musicComposer || [])
      setDirectedBy(movieDialog.movieToEdit.directedBy || [])
      setWrittenBy(movieDialog.movieToEdit.writtenBy || [])

      setMovie(movieDialog.movieToEdit)
      setLogos(movieDialog.movieToEdit.logosUrls || [])
      setBackgrounds(movieDialog.movieToEdit.backgroundsUrls || [])
      setPosters(movieDialog.movieToEdit.coversUrls || [])
      setSelectedLogo(movieDialog.movieToEdit.logoSrc || '')
      setSelectedPoster(movieDialog.movieToEdit.coverSrc || '')
      setSelectedBackground(movieDialog.movieToEdit.backgroundSrc || '')
      setLocalLogoFolder(`img/logos/${movieDialog.movieToEdit.id}`)
      setLocalBackgroundFolder(`img/backgrounds/${movieDialog.movieToEdit.id}`)
      setLocalPosterFolder(`img/posters/${movieDialog.movieToEdit.id}`)
      setSelectedTab(t('generalButton'))
    }
  }, [movieDialog])

  if (!movie) return null

  const handleEditMovie = async () => {
    if (serverUrl === '') return

    await connectWS(serverUrl)

    const response = await authenticatedFetch(
      `${serverUrl}/movie/${movie.id}`,
      'PUT',
      {
        ...movie,
        name,
        year,
        overview,
        tagline,
        productionStudios: studios,
        genres,
        creator,
        musicComposer: music,
        directedBy,
        writtenBy,
        nameLock,
        yearLock,
        overviewLock,
        taglineLock,
        productionStudiosLock: studiosLock,
        genresLock,
        creatorLock,
        musicComposerLock: musicLock,
        directedByLock,
        writtenByLock,
        logoSrc: selectedLogo ?? movie.logoSrc,
        coverSrc: selectedPoster ?? movie.coverSrc,
        backgroundSrc: selectedBackground ?? movie.backgroundSrc,
      },
    )

    if (!response || !response.ok) {
      showToast('error', 'Error updating movie')
      return
    }

    mutate((key: string) => key.startsWith(`${serverUrl}/details/movie`))
    mutate((key: string) => key.startsWith(`${serverUrl}/library-content`))

    closeMovieDialog()
  }

  const getWindowTitle = () => {
    return `${t('editButton')} ${movie.name}`
  }

  return (
    <ModalWrapper
      title={getWindowTitle()}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <MovieInfoTab
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
            <MovieTagsTab
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
              genresLock={genresLock}
              setGenresLock={setGenresLock}
              creatorLock={creatorLock}
              setCreatorLock={setCreatorLock}
              directedLock={directedByLock}
              setDirectedLock={setDirectedByLock}
              writtenLock={writtenByLock}
              setWrittenLock={setWrittenByLock}
              musicLock={musicLock}
              setMusicLock={setMusicLock}
            />
          ),
        },
        {
          title: t('media'),
          content: <MediaTab movie={movie} />,
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
      isOpen={movieDialog.isOpen}
      close={closeMovieDialog}
      onAccept={handleEditMovie}
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default MovieDialog
