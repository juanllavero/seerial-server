import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { ModalWrapper } from '@/components/ModalWrapper'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MediaSearchResult } from '@/data/interfaces/Utils'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DownloadMediaCard from './DownloadMediaCard'
import DownloadMediaCardSkeleton from './DownloadMediaCardSkeleton'
import { shallow } from 'zustand/shallow'
import useSWR from 'swr'
import { authenticatedFetch, authenticatedFetcher } from '@/lib/auth'

function DownloadMediaSearch() {
  const { t } = useTranslation()
  const serverUrl = useServerStore((state) => state.serverUrl)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { connectWS, downloadAudio, downloadVideo, downloaded, setDownloaded } =
    useWebSocketStore(
      (state) => ({
        connectWS: state.connectWS,
        downloadAudio: state.downloadAudio,
        downloadVideo: state.downloadVideo,
        downloaded: state.downloaded,
        setDownloaded: state.setDownloaded,
      }),
      shallow,
    )
  const {
    downloadMediaDialog: { type, seriesToEdit, seasonToEdit, movieToEdit },
    closeDownloadMediaDialog,
  } = useDialogStore(
    (state) => ({
      downloadMediaDialog: state.downloadMediaDialog,
      closeDownloadMediaDialog: state.closeDownloadMediaDialog,
    }),
    shallow,
  )
  const [openPlayer, setOpenPlayer] = useState<boolean>(false)
  const [playerResult, setPlayerResult] = useState<MediaSearchResult | null>(
    null,
  )
  const [searching, setSearching] = useState<boolean>(false)
  const [searchResults, setSearchResults] = useState<MediaSearchResult[]>([])
  const [searchText, setSearchText] = useState<string>('')
  const searchButtonRef = useRef<HTMLButtonElement>(null)

  const isShow: boolean =
    seriesToEdit !== undefined && seasonToEdit === undefined
  const isSeason: boolean =
    seasonToEdit !== undefined && seriesToEdit === undefined

  const { data: series } = useSWR(
    seasonToEdit
      ? `${serverUrl}/details/series?id=${seasonToEdit.seriesId}`
      : null,
    authenticatedFetcher,
  )

  useEffect(() => {
    if (!seriesToEdit && !seasonToEdit && !movieToEdit) return

    const baseText = isShow
      ? `${seriesToEdit?.name}`
      : isSeason
        ? `${series?.name} ${seasonToEdit?.name}`
        : (movieToEdit?.name ?? '')

    if (baseText === '') return

    const searchText = baseText + (type === 'music' ? ' ost' : ' trailer')

    setSearchText(searchText)
    search(searchText)

    // Focus the search button when the dialog is opened
    setTimeout(() => {
      searchButtonRef.current?.focus()
    }, 0)
  }, [seriesToEdit, seasonToEdit, movieToEdit])

  useEffect(() => {
    if (downloaded) {
      setDownloaded(false)
      closeDownloadMediaDialog()
    }
  }, [downloaded])

  const search = (text: string) => {
    setSearching(true)
    authenticatedFetch(`${serverUrl}/media/search?query=${text}`)
      .then(async (response) => {
        if (response && response.ok) {
          const data = await response.json()
          setSearchResults(data)
        }
      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => setSearching(false))
  }

  const downloadMedia = async (media: MediaSearchResult) => {
    if (serverUrl === '') return

    await connectWS(serverUrl)

    if (type === 'music') {
      await downloadAudio(
        media.id,
        media.url,
        serverUrl,
        isShow
          ? (seriesToEdit?.libraryId ?? '')
          : isSeason
            ? (series?.libraryId ?? '')
            : (movieToEdit?.libraryId ?? ''),
        isShow
          ? (seriesToEdit?.id ?? '')
          : isSeason
            ? (seasonToEdit?.id ?? '')
            : (movieToEdit?.id ?? ''),
      )
    } else {
      await downloadVideo(
        media.id,
        media.url,
        serverUrl,
        isShow
          ? (seriesToEdit?.libraryId ?? '')
          : isSeason
            ? (series?.libraryId ?? '')
            : (movieToEdit?.libraryId ?? ''),
        isShow
          ? (seriesToEdit?.id ?? '')
          : isSeason
            ? (seasonToEdit?.id ?? '')
            : (movieToEdit?.id ?? ''),
      )
    }
  }

  const playMedia = (result: MediaSearchResult) => {
    setPlayerResult(result)
    setOpenPlayer(true)
  }

  const getVideoId = (url: string) => {
    return url.match(/(?:v=|\/embed\/|\.be\/)([\w-]{11})/)?.[1]
  }

  return (
    <FlexBox
      direction="column"
      gap={1}
      height={'35rem'}
      width={isMobile || isTablet ? '100%' : '35rem'}
    >
      {/* Content */}
      <FlexBox gap={1} justify="center" align="center" width={'100%'}>
        <Input
          type="text"
          value={searchText}
          width={'100%'}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <FlexBox align="end" justify="end">
          <Button onClick={() => search(searchText)} ref={searchButtonRef}>
            {t('searchButton')}
          </Button>
        </FlexBox>
      </FlexBox>

      <FlexBox
        direction="column"
        scroll="vertical"
        hideScrollbar
        height={'100%'}
        width={'100%'}
      >
        {/* Results List */}
        {searching ? (
          Array.from({ length: 4 }).map((_, index) => (
            <DownloadMediaCardSkeleton key={index} />
          ))
        ) : searchResults && searchResults.length > 0 ? (
          searchResults.map((result: MediaSearchResult, index: number) => (
            <DownloadMediaCard
              key={index}
              result={result}
              playMedia={playMedia}
              downloadMedia={downloadMedia}
            />
          ))
        ) : (
          <span>{t('noResults')}</span>
        )}
      </FlexBox>

      <ModalWrapper
        title={''}
        tabs={[
          {
            title: '',
            content: playerResult && (
              <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${getVideoId(playerResult.url)}`}
                title="YouTube video player"
                allow="accelerometer; 
                autoplay; 
                clipboard-write; 
                encrypted-media; 
                gyroscope; 
                picture-in-picture; 
                web-share"
              ></iframe>
            ),
          },
        ]}
        isOpen={openPlayer}
        close={() => setOpenPlayer(false)}
        hideButtons
      />
    </FlexBox>
  )
}

export default DownloadMediaSearch
