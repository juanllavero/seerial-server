import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MediaSearchResult } from '@/data/interfaces/Utils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DownloadMediaCard from './DownloadMediaCard'

function DownloadMediaSearch() {
  const { t } = useTranslation()
  const { selectedServer } = useServerStore()
  const { connectWS, downloadAudio, downloadVideo, downloadingElementId } =
    useWebSocketStore()
  const {
    downloadMediaDialog: { type, seriesToEdit, seasonToEdit, movieToEdit },
    closeDownloadMediaDialog,
  } = useDialogStore()
  const [searchResults, setSearchResults] = useState<MediaSearchResult[]>([])
  const [searchText, setSearchText] = useState<string>('')

  const isShow = seriesToEdit

  useEffect(() => {
    const baseText = isShow
      ? `${seriesToEdit?.name} ${seasonToEdit?.name}`
      : (movieToEdit?.name ?? '')

    if (baseText === '') return

    const searchText = baseText + type === 'music' ? ' ost' : ' trailer'

    setSearchText(searchText)
    search(searchText)
  }, [seriesToEdit, movieToEdit])

  const search = (text: string) => {
    fetch(`https://${selectedServer?.ip}/media/search?query=${text}`)
      .then((response) => response.json())
      .then((data) => {
        setSearchResults(data)
      })
      .catch((error) => console.error(error))
  }

  const downloadMedia = async (media: MediaSearchResult) => {
    if (!selectedServer) return

    const serverIP = selectedServer?.ip

    await connectWS(serverIP)
    fetch(
      `https://${serverIP}/${type === 'music' ? 'downloadMusic' : 'downloadVideo'}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: media.url,
          downloadFolder: `resources/${type === 'music' ? 'music' : 'video'}`,
          fileName: isShow ? seasonToEdit?.id : movieToEdit?.id,
        }),
      },
    )
  }

  return (
    <FlexBox direction="column" gap={1} height={'35rem'} width={'35rem'}>
      {/* Content */}
      <FlexBox gap={1} justify="center" align="center">
        <LabeledInputWrapper label={t('name')}>
          <Input
            type="text"
            placeholder={t('text')}
            value={searchText}
            width={'100%'}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </LabeledInputWrapper>
        <FlexBox align="end" justify="end" height={'85%'}>
          <Button onClick={() => search(searchText)}>
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
        {searchResults && searchResults.length > 0 ? (
          searchResults.map((result: MediaSearchResult, index: number) => (
            <DownloadMediaCard
              key={index}
              result={result}
              downloadMedia={downloadMedia}
            />
          ))
        ) : searchResults && searchResults.length === 0 ? (
          <span>{t('noResults')}</span>
        ) : (
          <Loading />
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default DownloadMediaSearch
