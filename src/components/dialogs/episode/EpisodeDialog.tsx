import { useDialogStore } from '@/context/dialog.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Episode } from '@/data/interfaces/Media'
import { authenticatedFetch, authenticatedFetcher } from '@/lib/auth'
import { showToast } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import { ModalWrapper } from '../../ModalWrapper'
import GenericFormTab from '../components/GenericFormTab'
import ImageListTab from '../components/ImageListTab'
import {
  episodeInfoConfig,
  generateDefaultValues,
  generateResetValues,
  generateSubmitData,
} from '../forms.config'
import EpisodeMediaInfoTab from './components/EpisodeMediaInfoTab'

function EpisodeDialog() {
  const { t } = useTranslation()
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { episodeDialog, closeEpisodeDialog } = useDialogStore(
    (state) => ({
      episodeDialog: state.episodeDialog,
      closeEpisodeDialog: state.closeEpisodeDialog,
    }),
    shallow,
  )
  const { control, reset, handleSubmit } = useForm({
    defaultValues: generateDefaultValues(episodeInfoConfig),
  })

  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  const [images, setImages] = useState<string[]>([])
  const [localFolder, setLocalFolder] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string>('')

  const [episode, setEpisode] = useState<Episode | undefined>(
    episodeDialog.episodeToEdit,
  )

  const { data: series } = useSWR(
    episode ? `/api/details/seriesBySeasonId?id=${episode.seasonId}` : null,
    authenticatedFetcher,
  )

  useEffect(() => {
    if (episodeDialog && episodeDialog.episodeToEdit) {
      reset(generateResetValues(episodeDialog.episodeToEdit, episodeInfoConfig))
      setEpisode(episodeDialog.episodeToEdit)
      setImages(episodeDialog.episodeToEdit.video.imgUrls || [])
      setSelectedImage(episodeDialog.episodeToEdit.video.imgSrc || '')
      setLocalFolder(`img/thumbnails/video/${episodeDialog.episodeToEdit.id}`)
      setSelectedTab(t('generalButton'))
    }
  }, [episodeDialog, reset])

  if (!episode || !series) return null

  const handleEditEpisode = handleSubmit(async (data) => {
    await connectWS()

    const submitData = generateSubmitData(data, episode, episodeInfoConfig)

    const response = await authenticatedFetch(
      `/api/episode/${episode.id}`,
      'PUT',
      {
        ...submitData,
        imgSrc: selectedImage ?? episode.video.imgSrc,
      },
    )

    if (!response || !response.ok) {
      showToast('error', 'Error updating episode')
      return
    }

    mutate((key: string) => key.startsWith(`/api/details/season`))
    mutate((key: string) => key.startsWith(`/api/details/episode`))

    closeEpisodeDialog()
  })

  const getWindowTitle = () => {
    return `${t('editButton')} ${series.name} - ${episode.name} ${`(${t('seasonLetter')}${episode.seasonNumber}${t('episodeLetter')}${episode.episodeNumber})`}`
  }

  return (
    <ModalWrapper
      title={getWindowTitle()}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <GenericFormTab config={episodeInfoConfig} control={control} />
          ),
        },
        {
          title: t('thumbnailsButton'),
          content: (
            <ImageListTab
              imagesList={images}
              localFolder={localFolder}
              selectImage={setSelectedImage}
              selectedImage={selectedImage}
            />
          ),
        },
        {
          title: t('details'),
          content: <EpisodeMediaInfoTab video={episode.video} />,
        },
      ]}
      width="50rem"
      isOpen={episodeDialog.isOpen}
      close={closeEpisodeDialog}
      onAccept={handleEditEpisode}
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default EpisodeDialog
