import { ModalWrapper } from '@/components/ModalWrapper'
import { API } from '@/config/api'
import { useDialogStore } from '@/context/dialog.store'
import { Series } from '@/data/interfaces/Media'
import { useGet } from '@/hooks/media/useGet'
import useEditDialog from '@/hooks/useEditDialog'
import { ImageType } from '@/utils/constants'
import GenericFormTab from '../components/GenericFormTab'
import ImageListTab from '../components/ImageListTab'
import { seriesInfoConfig, seriesTagsConfig } from '../forms.config'
import MediaTab from '../MediaTab'

interface SeriesImageState {
  logos: string[]
  localLogoFolder: string
  selectedLogo: string
  posters: string[]
  localPosterFolder: string
  selectedPoster: string
}

function SeriesDialog() {
  const { payload, closeDialog } = useDialogStore()
  const { id } = payload as { id: string }
  const { data: series } = useGet<Series>(API.series.get(id))

  const { control, images, selectedTab, setSelectedTab, handleUpdate, t } =
    useEditDialog<Series, SeriesImageState>({
      entity: series,
      configs: [seriesInfoConfig, seriesTagsConfig],
      initialImages: {
        logos: [],
        localLogoFolder: '',
        selectedLogo: '',
        posters: [],
        localPosterFolder: '',
        selectedPoster: '',
      },
      getImagesFromEntity: (s) => ({
        logos: s.logosUrls || [],
        posters: s.coversUrls || [],
        selectedLogo: s.logoSrc || '',
        selectedPoster: s.coverSrc || '',
        localLogoFolder: `img/logos/${s.id}`,
        localPosterFolder: `img/posters/${s.id}`,
      }),
      getExtraSubmitData: (imgs, s) => ({
        logoSrc: imgs.selectedLogo ?? s.logoSrc,
        coverSrc: imgs.selectedPoster ?? s.coverSrc,
      }),
      apiUpdateUrl: series ? API.series.update(series.id) : '',
      errorMessage: 'Error updating series',
    })

  if (!series) return null

  return (
    <ModalWrapper
      title={`${t('editButton')} ${series.name}`}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <GenericFormTab config={seriesInfoConfig} control={control} />
          ),
        },
        {
          title: t('tags'),
          content: (
            <GenericFormTab config={seriesTagsConfig} control={control} />
          ),
        },
        { title: t('media'), content: <MediaTab series={series} /> },
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

export default SeriesDialog
