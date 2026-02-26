import { ModalWrapper } from '@/components/ModalWrapper'
import { API } from '@/config/api'
import { useDialogStore } from '@/context/dialog.store'
import { Movie } from '@/data/interfaces/Media'
import { useGet } from '@/hooks/media/useGet'
import useEditDialog from '@/hooks/useEditDialog'
import { ImageType } from '@/utils/constants'
import GenericFormTab from '../components/GenericFormTab'
import ImageListTab from '../components/ImageListTab'
import { movieInfoConfig, movieTagsConfig } from '../forms.config'
import MediaTab from '../MediaTab'

interface MovieImageState {
  logos: string[]
  localLogoFolder: string
  selectedLogo: string
  backgrounds: string[]
  localBackgroundFolder: string
  selectedBackground: string
  posters: string[]
  localPosterFolder: string
  selectedPoster: string
}

function MovieDialog() {
  const { payload, closeDialog } = useDialogStore()
  const { id } = payload as { id: string }
  const { data: movie } = useGet<Movie>(API.movies.get(id))

  const { control, images, selectedTab, setSelectedTab, handleUpdate, t } =
    useEditDialog<Movie, MovieImageState>({
      entity: movie,
      configs: [movieInfoConfig, movieTagsConfig],
      initialImages: {
        logos: [],
        localLogoFolder: '',
        selectedLogo: '',
        backgrounds: [],
        localBackgroundFolder: '',
        selectedBackground: '',
        posters: [],
        localPosterFolder: '',
        selectedPoster: '',
      },
      getImagesFromEntity: (m) => ({
        logos: m.logosUrls || [],
        backgrounds: m.backgroundsUrls || [],
        posters: m.coversUrls || [],
        selectedLogo: m.logoSrc || '',
        selectedPoster: m.coverSrc || '',
        selectedBackground: m.backgroundSrc || '',
        localLogoFolder: `img/logos/${m.id}`,
        localBackgroundFolder: `img/backgrounds/${m.id}`,
        localPosterFolder: `img/posters/${m.id}`,
      }),
      getExtraSubmitData: (imgs, m) => ({
        logoSrc: imgs.selectedLogo ?? m.logoSrc,
        coverSrc: imgs.selectedPoster ?? m.coverSrc,
        backgroundSrc: imgs.selectedBackground ?? m.backgroundSrc,
      }),
      apiUpdateUrl: movie ? API.movies.update(movie.id) : '',
      errorMessage: 'Error updating movie',
    })

  if (!movie) return null

  return (
    <ModalWrapper
      title={`${t('editButton')} ${movie.name}`}
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
        { title: t('media'), content: <MediaTab movie={movie} /> },
        {
          title: t('logosButton'),
          content: (
            <ImageListTab
              imagesList={images.logos}
              type={ImageType.LOGO}
              localFolder={images.localLogoFolder}
              selectImage={images.setSelectedLogo}
              selectedImage={images.selectedLogo}
            />
          ),
        },
        {
          title: t('backgroundsButton'),
          content: (
            <ImageListTab
              imagesList={images.backgrounds}
              localFolder={images.localBackgroundFolder}
              selectImage={images.setSelectedBackground}
              selectedImage={images.selectedBackground}
            />
          ),
        },
        {
          title: t('postersButton'),
          content: (
            <ImageListTab
              imagesList={images.posters}
              localFolder={images.localPosterFolder}
              selectImage={images.setSelectedPoster}
              selectedImage={images.selectedPoster}
              type={ImageType.POSTER}
            />
          ),
        },
      ]}
      width="50rem"
      isOpen={true}
      close={closeDialog}
      onAccept={handleUpdate}
      activeTab={selectedTab}
      onTabChange={setSelectedTab}
    />
  )
}

export default MovieDialog
