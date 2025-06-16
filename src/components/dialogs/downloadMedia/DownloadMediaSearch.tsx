import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import LazyImage from '@/components/ui/LazyImage'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import {
  IdentificationResult,
  MediaSearchResult,
} from '@/data/interfaces/Utils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './CorrectIdentificationSearch.css'

function DownloadMediaSearch() {
  const { t } = useTranslation()
  const { selectedServer } = useServerStore()
  const { connectWS } = useWebSocketStore()
  const { downloadMediaDialog, closeDownloadMediaDialog } = useDialogStore()
  const [searchResults, setSearchResults] = useState<MediaSearchResult[]>([])
  const [searchText, setSearchText] = useState<string>('')

  const isShow = downloadMediaDialog.seriesToEdit

  useEffect(() => {
    const baseText = isShow
      ? `${downloadMediaDialog.seriesToEdit?.name} ${downloadMediaDialog.seasonToEdit?.name}`
      : (downloadMediaDialog.movieToEdit?.name ?? '')

    if (baseText === '') return

    const searchText =
      baseText + downloadMediaDialog.type === 'music' ? ' ost' : ' trailer'

    setSearchText(searchText)
    search(searchText)
  }, [])

  const search = (text: string) => {
    fetch(
      `https://${selectedServer?.ip}/${isShow ? 'shows' : 'movies'}/search?text=${text}`,
    )
      .then((response) => response.json())
      .then((data) => {
        setSearchResults(data)
      })
      .catch((error) => console.error(error))
  }

  const saveIdentification = async (id: number) => {
    if (!selectedServer) return

    const serverIP = selectedServer?.ip

    await connectWS(serverIP)
    fetch(`https://${serverIP}/${isShow ? 'updateShowId' : 'updateMovieId'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        isShow
          ? {
              showId: downloadMediaDialog.seriesToEdit?.id,
              themdbId: id,
            }
          : {
              collectionId: downloadMediaDialog.seriesToEdit?.id,
              movieId: downloadMediaDialog.movieToEdit?.id,
              themdbId: id,
            },
      ),
    })

    closeDownloadMediaDialog()
  }

  return (
    <FlexBox direction="column" gap={1} height={'35rem'} width={'35rem'}>
      <FlexBox gap={1} justify="center" align="center">
        <LabeledInputWrapper label={t('name')}>
          <Input
            type="text"
            placeholder={t('name')}
            value={name}
            width={'100%'}
            onChange={(e) => setName(e.target.value)}
          />
        </LabeledInputWrapper>
        <FlexBox width={'50%'}>
          <LabeledInputWrapper label={t('year')}>
            <Input
              type="number"
              placeholder={t('year')}
              value={year}
              width={'100%'}
              onChange={(e) => setYear(e.target.value)}
            />
          </LabeledInputWrapper>
        </FlexBox>
        <FlexBox align="end" justify="end" height={'85%'}>
          <Button onClick={() => search(name, year)}>
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
        {identificationResults && identificationResults.length > 0 ? (
          identificationResults.map(
            (result: IdentificationResult, index: number) => (
              <FlexBox
                className="identification-card"
                key={index}
                onClick={() => saveIdentification(result.id)}
                padding="1rem"
                gap={1}
              >
                <FlexBox direction="column" gap={0.5} width={'75%'}>
                  <span className="font-semibold">
                    {isShow ? result.name : result.title}
                  </span>
                  <span className="text-sm" style={{ color: 'lightgray' }}>
                    {isShow
                      ? ((result.first_air_date ?? '') as string).split('-')[0]
                      : (result.release_date ?? '')}
                  </span>
                  <span className="mt-1 line-clamp-4 text-ellipsis">
                    {result.overview}
                  </span>
                </FlexBox>

                <FlexBox width={'25%'}>
                  <LazyImage
                    src={`http://image.tmdb.org/t/p/original/${result.poster_path}`}
                    alt={result.name ?? result.title ?? 'Poster'}
                    width={'100%'}
                    height={'auto'}
                  />
                </FlexBox>
              </FlexBox>
            ),
          )
        ) : identificationResults && identificationResults.length === 0 ? (
          <span>{t('noResults')}</span>
        ) : (
          <Loading />
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default DownloadMediaSearch
