import { ModalWrapper } from '@/components/ModalWrapper'
import { useDialogStore } from '@/context/dialog.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Movie } from '@/data/interfaces/Media'
import { authenticatedFetch } from '@/lib/auth'
import { ImageType } from '@/utils/constants'
import { showToast } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import GenericFormTab from '../components/GenericFormTab'
import ImageListTab from '../components/ImageListTab'
import {
  generateDefaultValues,
  generateResetValues,
  generateSubmitData,
  movieInfoConfig,
  movieTagsConfig,
} from '../forms.config'
import MediaTab from '../MediaTab'

function MovieDialog() {
  const { t } = useTranslation()
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { movieDialog, closeMovieDialog } = useDialogStore(
    (state) => ({
      movieDialog: state.movieDialog,
      closeMovieDialog: state.closeMovieDialog,
    }),
    shallow,
  )
  const { control, reset, handleSubmit } = useForm({
    defaultValues: generateDefaultValues(movieInfoConfig, movieTagsConfig),
  })

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

  useEffect(() => {
    if (movieDialog && movieDialog.movieToEdit) {
      reset(
        generateResetValues(
          movieDialog.movieToEdit,
          movieInfoConfig,
          movieTagsConfig,
        ),
      )

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
  }, [movieDialog, reset])

  if (!movie) return null

  const handleEditMovie = handleSubmit(async (data) => {
    await connectWS()

    const submitData = generateSubmitData(
      data,
      movie,
      movieInfoConfig,
      movieTagsConfig,
    )

    const response = await authenticatedFetch(`/api/movie/${movie.id}`, 'PUT', {
      ...submitData,
      logoSrc: selectedLogo ?? movie.logoSrc,
      coverSrc: selectedPoster ?? movie.coverSrc,
      backgroundSrc: selectedBackground ?? movie.backgroundSrc,
    })

    if (!response || !response.ok) {
      showToast('error', 'Error updating movie')
      return
    }

    mutate((key: string) => key.startsWith(`/api/details/movie`))
    mutate((key: string) => key.startsWith(`/api/library-content`))

    closeMovieDialog()
  })

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
            <GenericFormTab config={movieInfoConfig} control={control} />
          ),
        },
        {
          title: t('tags'),
          content: (
            <GenericFormTab config={movieTagsConfig} control={control} />
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
