import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import LazyImage from '@/components/ui/LazyImage'
import { API, authenticatedFetch } from '@/config/api'
import { useDialogStore } from '@/context/dialog.store'
import { useWebSocketStore } from '@/context/ws.context'
import { IdentificationResult } from '@/data/interfaces/Utils'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { shallow } from 'zustand/shallow'
import './CorrectIdentificationSearch.css'

function CorrectIdentificationSearch() {
  const { t } = useTranslation()
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { identificationDialog, closeIdentificationDialog } = useDialogStore(
    (state) => ({
      identificationDialog: state.identificationDialog,
      closeIdentificationDialog: state.closeIdentificationDialog,
    }),
    shallow,
  )
  const [identificationResults, setIdentificationResults] = useState<
    IdentificationResult[]
  >([])
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const searchButtonRef = useRef<HTMLButtonElement>(null)

  const isShow = identificationDialog.seriesToEdit

  useEffect(() => {
    setName(
      isShow
        ? (identificationDialog.seriesToEdit?.name ?? '')
        : (identificationDialog.movieToEdit?.name ?? ''),
    )
    setYear(
      isShow
        ? (identificationDialog.movieToEdit?.year ?? '')
        : (identificationDialog.seriesToEdit?.year ?? ''),
    )
    search(
      isShow
        ? (identificationDialog.seriesToEdit?.name ?? '')
        : (identificationDialog.movieToEdit?.name ?? ''),
      isShow
        ? (identificationDialog.movieToEdit?.year ?? '')
        : (identificationDialog.seriesToEdit?.year ?? ''),
    )

    // Focus the search button when the dialog is opened
    setTimeout(() => {
      searchButtonRef.current?.focus()
    }, 0)
  }, [identificationDialog])

  const search = (name: string, year: string) => {
    authenticatedFetch(
      `${isShow ? API.series.search : API.movies.search}?name=${name}&year=${year}`,
    )
      .then((response) => response.data)
      .then((data) => {
        setIdentificationResults(data)
      })
      .catch((error) => console.error(error))
  }

  const saveIdentification = async (id: number) => {
    await connectWS()
    authenticatedFetch(
      `/api/${isShow ? 'showId' : 'movieId'}`,
      'POST',
      isShow
        ? {
            showId: identificationDialog.seriesToEdit?.id,
            themdbId: id,
          }
        : {
            collectionId: identificationDialog.seriesToEdit?.id,
            movieId: identificationDialog.movieToEdit?.id,
            themdbId: id,
          },
    )

    closeIdentificationDialog()
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
          <Button onClick={() => search(name, year)} ref={searchButtonRef}>
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
                    src={`https://image.tmdb.org/t/p/original/${result.poster_path}`}
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
