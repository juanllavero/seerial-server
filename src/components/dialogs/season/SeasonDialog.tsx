import { ModalWrapper } from '@/components/ModalWrapper'
import { API, authenticatedFetch, authenticatedFetcher } from '@/config/api'
import { useDialogStore } from '@/context/dialog.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Season } from '@/data/interfaces/Media'
import { showToast } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import GenericFormTab from '../components/GenericFormTab'
import ImageListTab from '../components/ImageListTab'
import {
  generateDefaultValues,
  generateResetValues,
  generateSubmitData,
  seasonInfoConfig,
} from '../forms.config'
import MediaTab from '../MediaTab'

function SeasonDialog() {
  const { t } = useTranslation()
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { seasonDialog, closeSeasonDialog } = useDialogStore(
    (state) => ({
      seasonDialog: state.seasonDialog,
      closeSeasonDialog: state.closeSeasonDialog,
    }),
    shallow,
  )
  const { control, reset, handleSubmit } = useForm({
    defaultValues: generateDefaultValues(seasonInfoConfig),
  })

  // Note: Similar standardization applied to Episode and Movie dialogs

  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  const [season, setSeason] = useState<Season | undefined>(undefined)

  const { data: series } = useSWR(
    seasonDialog.seasonToEdit
      ? API.series.get(seasonDialog.seasonToEdit.seriesId)
      : null,
    authenticatedFetcher,
  )

  // Background
  const [backgrounds, setBackgrounds] = useState<string[]>([])
  const [localBackgroundFolder, setLocalBackgroundFolder] = useState<string>('')
  const [selectedBackground, setSelectedBackground] = useState<string>('')

  useEffect(() => {
    if (seasonDialog && seasonDialog.seasonToEdit) {
      reset(generateResetValues(seasonDialog.seasonToEdit, seasonInfoConfig))

      setSeason(seasonDialog.seasonToEdit)
      setBackgrounds(seasonDialog.seasonToEdit.backgroundsUrls || [])
      setSelectedBackground(seasonDialog.seasonToEdit.backgroundSrc || '')
      setLocalBackgroundFolder(
        `img/backgrounds/${seasonDialog.seasonToEdit.id}`,
      )
      setSelectedTab(t('generalButton'))
    }
  }, [seasonDialog, reset])

  if (!season) return null

  const handleEditSeason = handleSubmit(async (data) => {
    await connectWS()

    const submitData = generateSubmitData(data, season, seasonInfoConfig)

    const response = await authenticatedFetch(
      API.seasons.update(season.id),
      'PUT',
      {
        ...submitData,
        backgroundSrc: selectedBackground ?? season.backgroundSrc,
      },
    )

    if (!response || !response.data) {
      showToast('error', 'Error updating episode')
      return
    }

    mutate((key: string) => key.startsWith(`/api/details/series`))
    mutate((key: string) => key.startsWith(`/api/details/season`))

    closeSeasonDialog()
  })

  const getWindowTitle = () => {
    return `${t('editButton')} ${series?.name} - ${season.name}`
  }

  return (
    <ModalWrapper
      title={getWindowTitle()}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <GenericFormTab config={seasonInfoConfig} control={control} />
          ),
        },
        {
          title: t('media'),
          content: <MediaTab season={season} />,
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
      ]}
      width="50rem"
      isOpen={seasonDialog.isOpen}
      close={closeSeasonDialog}
      onAccept={handleEditSeason}
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default SeasonDialog
