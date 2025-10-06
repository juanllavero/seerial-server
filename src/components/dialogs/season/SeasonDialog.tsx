import { ModalWrapper } from '@/components/ModalWrapper'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Season } from '@/data/interfaces/Media'
import { showToast } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'
import ImageListTab from '../components/ImageListTab'
import SeasonInfoTab from './components/SeasonInfoTab'
import { shallow } from 'zustand/shallow'
import MediaTab from '../MediaTab'
import { authenticatedFetch, authenticatedFetcher } from '@/lib/auth'

function SeasonDialog() {
  const { t } = useTranslation()
  const serverUrl = useServerStore((state) => state.serverUrl)
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { seasonDialog, closeSeasonDialog } = useDialogStore(
    (state) => ({
      seasonDialog: state.seasonDialog,
      closeSeasonDialog: state.closeSeasonDialog,
    }),
    shallow,
  )
  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  const [season, setSeason] = useState<Season | undefined>(undefined)

  const { data: series } = useSWR(
    seasonDialog.seasonToEdit && serverUrl !== ''
      ? `${serverUrl}/details/series?id=${seasonDialog.seasonToEdit.seriesId}`
      : null,
    authenticatedFetcher,
  )

  // Background
  const [backgrounds, setBackgrounds] = useState<string[]>([])
  const [localBackgroundFolder, setLocalBackgroundFolder] = useState<string>('')
  const [selectedBackground, setSelectedBackground] = useState<string>('')

  //#region ATTRIBUTES
  const [nameLock, setNameLock] = useState<boolean>(false)
  const [yearLock, setYearLock] = useState<boolean>(false)
  const [overviewLock, setOverviewLock] = useState<boolean>(false)

  const [name, setName] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [overview, setOverview] = useState<string>('')
  //#endregion

  useEffect(() => {
    if (seasonDialog && seasonDialog.seasonToEdit) {
      setNameLock(seasonDialog.seasonToEdit.nameLock || false)
      setYearLock(seasonDialog.seasonToEdit.yearLock || false)
      setOverviewLock(seasonDialog.seasonToEdit.overviewLock || false)
      setName(seasonDialog.seasonToEdit.name)
      setYear(seasonDialog.seasonToEdit.year)
      setOverview(seasonDialog.seasonToEdit.overview)

      setSeason(seasonDialog.seasonToEdit)
      setBackgrounds(seasonDialog.seasonToEdit.backgroundsUrls || [])
      setSelectedBackground(seasonDialog.seasonToEdit.backgroundSrc || '')
      setLocalBackgroundFolder(
        `img/backgrounds/${seasonDialog.seasonToEdit.id}`,
      )
      setSelectedTab(t('generalButton'))
    }
  }, [seasonDialog])

  if (!season) return null

  const handleEditSeason = async () => {
    if (serverUrl === '') return

    await connectWS(serverUrl)

    const response = await authenticatedFetch(
      `${serverUrl}/season/${season.id}`,
      'PUT',
      {
        ...season,
        backgroundSrc: selectedBackground ?? season.backgroundSrc,
        name: name,
        year: year,
        overview: overview,
        nameLock: nameLock,
        yearLock: yearLock,
        overviewLock: overviewLock,
      },
    )

    if (!response || !response.ok) {
      showToast('error', 'Error updating episode')
      return
    }

    mutate((key: string) => key.startsWith(`${serverUrl}/details/series`))
    mutate((key: string) => key.startsWith(`${serverUrl}/details/season`))

    closeSeasonDialog()
  }

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
            />
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
