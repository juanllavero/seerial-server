import {
  useChangeMovieIdentification,
  useGet,
  useGetMovie,
  useGetSeries,
  useUpdateSeriesShowId,
} from '@seerial/api';
import type { Movie, Series } from '@seerial/domain';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import LabeledInputWrapper from '@/components/form/LabeledInputWrapper';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import FlexBox from '@/components/ui/FlexBox';
import { Input } from '@/components/ui/input';
import LazyImage from '@/components/ui/LazyImage';
import { API } from '@/config/api';
import { useDialogStore } from '@/context/dialog.store';
import { useWebSocketStore } from '@seerial/stores';
import './CorrectIdentificationSearch.css';

interface IdentificationResult {
  id: number;
  name?: string;
  title?: string;
  first_air_date?: string;
  release_date?: string;
  poster_path: string;
  overview: string;
}

function CorrectIdentificationSearch() {
  const { t } = useTranslation();
  const connectWS = useWebSocketStore((state) => state.connectWS);
  const { open, payload, closeDialog } = useDialogStore(
    (state) => ({
      open: state.open,
      payload: state.payload,
      closeDialog: state.closeDialog,
    }),
    shallow,
  );
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [searchQuery, setSearchQuery] = useState<{ name: string; year: string } | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const seriesId =
    open === 'identification' && payload && 'seriesId' in payload ? payload.seriesId : undefined;
  const movieId =
    open === 'identification' && payload && 'movieId' in payload ? payload.movieId : undefined;
  const isShow = Boolean(seriesId);

  const { data: series } = useGetSeries<Series>(seriesId ?? '', {
    enabled: Boolean(seriesId),
  });
  const { data: movie } = useGetMovie<Movie>(movieId ?? '', {
    enabled: Boolean(movieId),
  });

  const searchUrl = searchQuery
    ? `${isShow ? API.series.search : API.movies.search}?name=${encodeURIComponent(searchQuery.name)}&year=${encodeURIComponent(searchQuery.year)}`
    : null;

  const {
    data: identificationResults,
    isLoading: isSearching,
    mutate: mutateSearch,
  } = useGet<IdentificationResult[]>(searchUrl, {
    enabled: false,
  });

  const { mutateAsync: updateSeriesShowId } = useUpdateSeriesShowId();
  const { mutateAsync: changeMovieIdentification } = useChangeMovieIdentification(movieId ?? '');

  useEffect(() => {
    const defaultName = isShow ? (series?.name ?? '') : (movie?.name ?? '');
    const defaultYear = isShow ? (series?.year ?? '') : (movie?.year ?? '');

    setName(defaultName);
    setYear(defaultYear);
    setSearchQuery({ name: defaultName, year: defaultYear });

    // Focus the search button when the dialog is opened
    setTimeout(() => {
      searchButtonRef.current?.focus();
    }, 0);
  }, [isShow, movie?.id, movie?.name, movie?.year, series?.id, series?.name, series?.year]);

  useEffect(() => {
    if (searchQuery) {
      mutateSearch();
    }
  }, [searchQuery, mutateSearch]);

  const search = (name: string, year: string) => {
    setSearchQuery({ name, year });
  };

  const saveIdentification = async (id: number) => {
    await connectWS();

    if (isShow) {
      await updateSeriesShowId({
        showId: seriesId,
        themdbId: id,
      });
    } else {
      await changeMovieIdentification({
        themdbId: id,
      });
    }

    closeDialog();
  };

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

      <FlexBox direction="column" scroll="vertical" hideScrollbar height={'100%'} width={'100%'}>
        {/* Results List */}
        {isSearching ? (
          <Loading />
        ) : identificationResults && identificationResults.length > 0 ? (
          identificationResults.map((result: IdentificationResult) => (
            <FlexBox
              className="identification-card"
              key={result.id}
              onClick={() => saveIdentification(result.id)}
              padding="1rem"
              gap={1}
            >
              <FlexBox direction="column" gap={0.5} width={'75%'}>
                <span className="font-semibold">{isShow ? result.name : result.title}</span>
                <span className="text-sm" style={{ color: 'lightgray' }}>
                  {isShow
                    ? ((result.first_air_date ?? '') as string).split('-')[0]
                    : (result.release_date ?? '')}
                </span>
                <span className="mt-1 line-clamp-4 text-ellipsis">{result.overview}</span>
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
          ))
        ) : identificationResults && identificationResults.length === 0 ? (
          <span>{t('noResults')}</span>
        ) : (
          <Loading />
        )}
      </FlexBox>
    </FlexBox>
  );
}

export default CorrectIdentificationSearch;
