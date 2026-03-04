import { ModalWrapper } from '@/components/ModalWrapper'
import { API } from '@/config/api'
import { useDialogStore } from '@/context/dialog.store'
import { Season, Series } from '@/data/interfaces/Media'
import { useGet } from '@/hooks/media/useGet'
import useEditDialog from '@/hooks/useEditDialog'
import GenericFormTab from '../components/GenericFormTab'
import ImageListTab from '../components/ImageListTab'
import { seasonInfoConfig } from '../forms.config'
import MediaTab from '../MediaTab'

interface SeasonImageState {
  backgrounds: string[]
  localBackgroundFolder: string
  selectedBackground: string
}

function SeasonDialog() {
  const { payload, closeDialog } = useDialogStore()
  const { id } = payload as { id: string }
  const { data: season } = useGet<Season>(API.seasons.get(id))
  const { data: series } = useGet<Series>(
    season ? API.series.get(season.seriesId) : null,
  )

  const { control, images, selectedTab, setSelectedTab, handleUpdate, t } =
    useEditDialog<Season, SeasonImageState>({
      entity: season,
      configs: [seasonInfoConfig],
      initialImages: {
        backgrounds: [],
        localBackgroundFolder: '',
        selectedBackground: '',
      },
      getImagesFromEntity: (s) => ({
        backgrounds: s.backgroundsUrls || [],
        selectedBackground: s.backgroundSrc || '',
        localBackgroundFolder: `img/backgrounds/${s.id}`,
      }),
      getExtraSubmitData: (imgs, s) => ({
        backgroundSrc: imgs.selectedBackground ?? s.backgroundSrc,
      }),
      apiUpdateUrl: season ? API.seasons.update(season.id) : '',
      errorMessage: 'Error updating season',
    })

  if (!season) return null

  return (
    <ModalWrapper
      title={`${t('editButton')} ${series?.name} - ${season.name}`}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <GenericFormTab config={seasonInfoConfig} control={control} />
          ),
        },
        { title: t('media'), content: <MediaTab season={season} /> },
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
      ]}
      isOpen={true}
      close={closeDialog}
      onAccept={handleUpdate}
      activeTab={selectedTab}
      onTabChange={setSelectedTab}
    />
  )
}

export default SeasonDialog
