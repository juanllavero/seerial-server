import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import LazyImage from '@/components/ui/LazyImage'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { IdentificationResult } from '@/data/interfaces/Utils'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './CorrectIdentificationSearch.css'

function CorrectIdentificationSearch() {
  const { t } = useTranslation()
  const { serverIP } = useServerStore()
  const { connectWS } = useWebSocketStore()
  const { selectedLibrary } = useDataStore()
  const { identificationDialog, closeIdentificationDialog } = useDialogStore()
  const [identificationResults, setIdentificationResults] = useState<
    IdentificationResult[]
  >([])
  const [name, setName] = useState('')
  const [year, setYear] = useState('')

  const isShow = identificationDialog.seriesToEdit

  useEffect(() => {
    setName(
      isShow
        ? (identificationDialog.seriesToEdit?.name ?? '')
        : (identificationDialog.seasonToEdit?.name ?? ''),
    )
    setYear(
      isShow
        ? (identificationDialog.seasonToEdit?.year ?? '')
        : (identificationDialog.seriesToEdit?.year ?? ''),
    )
    search(
      isShow
        ? (identificationDialog.seriesToEdit?.name ?? '')
        : (identificationDialog.seasonToEdit?.name ?? ''),
      isShow
        ? (identificationDialog.seasonToEdit?.year ?? '')
        : (identificationDialog.seriesToEdit?.year ?? ''),
    )
  }, [])

  const search = (name: string, year: string) => {
    fetch(
      `http://${serverIP}/${isShow ? 'shows' : 'movies'}/search?name=${name}&year=${year}`,
    )
      .then((response) => response.json())
      .then((data) => {
        setIdentificationResults(data)
      })
      .catch((error) => console.error(error))
  }

  const saveIdentification = async (id: number) => {
    await connectWS(serverIP)
    fetch(`http://${serverIP}/${isShow ? 'updateShowId' : 'updateMovieId'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        isShow
          ? {
              libraryId: selectedLibrary?.id,
              showId: identificationDialog.seriesToEdit?.id,
              themdbId: id,
            }
          : {
              libraryId: selectedLibrary?.id,
              collectionId: identificationDialog.seriesToEdit?.id,
              seasonId: identificationDialog.seasonToEdit?.id,
              themdbId: id,
            },
      ),
    })

    closeIdentificationDialog()
  }

  return (
    <FlexBox direction="column" gap={1} height={'35rem'} width={'35rem'}>
      <FlexBox gap={1} justify="center" align="center">
        <LabeledInputWrapper label="Name">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            width={'100%'}
            onChange={(e) => setName(e.target.value)}
          />
        </LabeledInputWrapper>
        <FlexBox width={'50%'}>
          <LabeledInputWrapper label="Year">
            <Input
              type="number"
              placeholder="Year"
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

export default CorrectIdentificationSearch
