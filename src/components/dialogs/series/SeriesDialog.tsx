import { ModalWrapper } from '@/components/ModalWrapper'
import { API, authenticatedFetch } from '@/config/api'
import { useDialogStore } from '@/context/dialog.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Series } from '@/data/interfaces/Media'
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
  seriesInfoConfig,
  seriesTagsConfig,
} from '../forms.config'
import MediaTab from '../MediaTab'

function SeriesDialog() {
  const { t } = useTranslation()
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { seriesDialog, closeSeriesDialog } = useDialogStore(
    (state) => ({
      seriesDialog: state.seriesDialog,
      closeSeriesDialog: state.closeSeriesDialog,
    }),
    shallow,
  )
  const { control, reset, handleSubmit } = useForm({
    defaultValues: generateDefaultValues(seriesInfoConfig, seriesTagsConfig),
  })

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

  useEffect(() => {
    if (seriesDialog && seriesDialog.seriesToEdit) {
      reset(
        generateResetValues(
          seriesDialog.seriesToEdit,
          seriesInfoConfig,
          seriesTagsConfig,
        ),
      )

      setSeries(seriesDialog.seriesToEdit)
      setLogos(seriesDialog.seriesToEdit.logosUrls || [])
      setPosters(seriesDialog.seriesToEdit.coversUrls || [])
      setSelectedLogo(seriesDialog.seriesToEdit.logoSrc || '')
      setSelectedPoster(seriesDialog.seriesToEdit.coverSrc || '')
      setLocalLogoFolder(`img/logos/${seriesDialog.seriesToEdit.id}`)
      setLocalPosterFolder(`img/posters/${seriesDialog.seriesToEdit.id}`)
      setSelectedTab(t('generalButton'))
    }
  }, [seriesDialog, reset])

  if (!series) return null

  const handleEditMovie = handleSubmit(async (data) => {
    await connectWS()

    const submitData = generateSubmitData(
      data,
      series,
      seriesInfoConfig,
      seriesTagsConfig,
    )

    try {
      await authenticatedFetch(API.series.update(series.id), 'PUT', {
        ...submitData,
        logoSrc: selectedLogo ?? series.logoSrc,
        coverSrc: selectedPoster ?? series.coverSrc,
      })

      mutate((key: string) => key.startsWith(API.media.details('series')))
      mutate((key: string) => key.startsWith(API.libraries.content('')))

      closeSeriesDialog()
    } catch (error) {
      showToast('error', 'Error updating series')
    }
  })

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
            <GenericFormTab config={seriesInfoConfig} control={control} />
          ),
        },
        {
          title: t('tags'),
          content: (
            <GenericFormTab config={seriesTagsConfig} control={control} />
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
