import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
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
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import DownloadMediaCardSkeleton from './DownloadMediaCardSkeleton'
import { ModalWrapper } from '@/components/ModalWrapper'

function DownloadMediaSearch() {
  const { t } = useTranslation()
  const { selectedServer } = useServerStore()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { connectWS, downloadAudio, downloadVideo, downloaded, setDownloaded } =
    useWebSocketStore()
  const {
    downloadMediaDialog: { type, seriesToEdit, seasonToEdit, movieToEdit },
    closeDownloadMediaDialog,
  } = useDialogStore()
  const [openPlayer, setOpenPlayer] = useState<boolean>(false)
  const [playerResult, setPlayerResult] = useState<MediaSearchResult | null>(
    null,
  )
  const [searching, setSearching] = useState<boolean>(false)
  const [searchResults, setSearchResults] = useState<MediaSearchResult[]>([])
  const [searchText, setSearchText] = useState<string>('')
  const searchButtonRef = useRef<HTMLButtonElement>(null)

  const isShow: boolean = seriesToEdit !== undefined

  console.log({
    type,
    isShow,
    seriesToEdit,
    seasonToEdit,
    movieToEdit,
  })

  useEffect(() => {
    if (!seasonToEdit && !movieToEdit) return

    const baseText = isShow
      ? `${seriesToEdit?.name} ${seasonToEdit?.name}`
      : (movieToEdit?.name ?? '')

    if (baseText === '') return

    const searchText = baseText + (type === 'music' ? ' ost' : ' trailer')

    setSearchText(searchText)
    search(searchText)

    // Focus the search button when the dialog is opened
    setTimeout(() => {
      searchButtonRef.current?.focus()
    }, 0)
  }, [seasonToEdit, movieToEdit])

  useEffect(() => {
    if (downloaded) {
      setDownloaded(false)
      closeDownloadMediaDialog()
    }
  }, [downloaded])

  const search = (text: string) => {
    setSearching(true)
    fetch(`https://${selectedServer?.ip}/media/search?query=${text}`)
      .then((response) => response.json())
      .then((data) => {
        setSearchResults(data)
        setSearching(false)
      })
      .catch((error) => {
        console.error(error)
        setSearching(false)
      })
  }

  const downloadMedia = async (media: MediaSearchResult) => {
    if (!selectedServer) return

    await connectWS(selectedServer.ip)

    if (type === 'music') {
      await downloadAudio(
        media.id,
        media.url,
        selectedServer.ip,
        isShow
          ? (seriesToEdit?.libraryId ?? '')
          : (movieToEdit?.libraryId ?? ''),
        isShow ? (seasonToEdit?.id ?? '') : (movieToEdit?.id ?? ''),
      )
    } else {
      await downloadVideo(
        media.id,
        media.url,
        selectedServer.ip,
        isShow
          ? (seriesToEdit?.libraryId ?? '')
          : (movieToEdit?.libraryId ?? ''),
        isShow ? (seasonToEdit?.id ?? '') : (movieToEdit?.id ?? ''),
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
        <LabeledInputWrapper label={t('text')}>
          <Input
            type="text"
            placeholder={t('text')}
            value={searchText}
            width={'100%'}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </LabeledInputWrapper>
        <FlexBox align="end" justify="end" height={'85%'}>
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
