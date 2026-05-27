import { API, useGet, useGetSeries, useSearchMedia } from '@seerial/api';
import type { MediaSearchResult, Movie, Season, Series } from '@seerial/domain';
import { useWebSocketStore } from '@seerial/stores';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useIsTablet } from '@/shared/hooks/use-tablet';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';
import { Input } from '@/shared/ui/input';
import { ModalWrapper } from '@/shared/ui/modal-wrapper';
import { type DialogPayloads, useDialogStore } from '../../../stores/dialog-store';
import DownloadMediaCard from './download-media-card';
import DownloadMediaCardSkeleton from './download-media-card-skeleton';

interface DownloadTarget {
  mediaFolder: string;
  fileBaseName: string;
}

function buildDefaultSearchText(
  type: 'music' | 'video',
  isShow: boolean,
  isSeason: boolean,
  seriesName?: string,
  seasonName?: string,
  movieName?: string,
) {
  const baseText = isShow
    ? (seriesName ?? '')
    : isSeason
      ? `${seriesName ?? ''} ${seasonName ?? ''}`.trim()
      : (movieName ?? '');

  if (baseText === '') return '';

  return baseText + (type === 'music' ? ' ost' : ' trailer');
}

function getDownloadTarget(
  isMovie: boolean,
  isSeason: boolean,
  movie: Movie | null | undefined,
  season: Season | null | undefined,
  series: Series | null | undefined,
): DownloadTarget {
  if (isMovie) {
    return {
      mediaFolder: movie?.folder ? `${movie.folder}/media` : '',
      fileBaseName: '',
    };
  }

  if (isSeason) {
    const seasonNum = season?.seasonNumber ?? 1;
    return {
      mediaFolder: series?.folder ? `${series.folder}/media` : '',
      fileBaseName: `s${seasonNum}_`,
    };
  }

  return {
    mediaFolder: series?.folder ? `${series.folder}/media` : '',
    fileBaseName: '',
  };
}

function renderResults(
  searching: boolean,
  hasError: boolean,
  searchResults: MediaSearchResult[] | undefined,
  noResultsText: string,
  playMedia: (result: MediaSearchResult) => void,
  downloadMedia: (result: MediaSearchResult) => void,
) {
  if (searching) {
    return ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4'].map((key) => (
      <DownloadMediaCardSkeleton key={key} />
    ));
  }

  if (hasError || !searchResults || searchResults.length === 0) {
    return <span>{noResultsText}</span>;
  }

  return searchResults.map((result: MediaSearchResult) => (
    <DownloadMediaCard
      key={result.id}
      result={result}
      playMedia={playMedia}
      downloadMedia={downloadMedia}
    />
  ));
}

function DownloadMediaSearch() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { connectWS, downloadAudio, downloadVideo, downloaded, setDownloaded } = useWebSocketStore(
    (state) => ({
      connectWS: state.connectWS,
      downloadAudio: state.downloadAudio,
      downloadVideo: state.downloadVideo,
      downloaded: state.downloaded,
      setDownloaded: state.setDownloaded,
    }),
    shallow,
  );
  const { open, payload, closeDialog } = useDialogStore(
    (state) => ({
      open: state.open,
      payload: state.payload,
      closeDialog: state.closeDialog,
    }),
    shallow,
  );
  const downloadMediaPayload: DialogPayloads['downloadMedia'] | null =
    open === 'downloadMedia' ? (payload as DialogPayloads['downloadMedia']) : null;
  const type = downloadMediaPayload?.type ?? 'video';
  const seriesId = downloadMediaPayload?.seriesId;
  const seasonId = downloadMediaPayload?.seasonId;
  const movieId = downloadMediaPayload?.movieId;

  const [openPlayer, setOpenPlayer] = useState<boolean>(false);
  const [playerResult, setPlayerResult] = useState<MediaSearchResult | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [submittedSearchText, setSubmittedSearchText] = useState<string>('');
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const isShow = Boolean(seriesId) && !seasonId && !movieId;
  const isSeason = Boolean(seasonId);
  const isMovie = Boolean(movieId);

  const { data: season } = useGet<Season>(seasonId ? API.seasons.get(seasonId) : null);
  const { data: movie } = useGet<Movie>(movieId ? API.movies.get(movieId) : null);

  const seriesLookupId = seriesId ?? season?.seriesId ?? '';
  const { data: series } = useGetSeries<Series>(seriesLookupId, {
    enabled: Boolean(seriesLookupId),
  });

  const {
    data: searchResults,
    isFetching: searching,
    error: searchError,
  } = useSearchMedia<MediaSearchResult[]>({
    enabled: submittedSearchText !== '',
    params: { query: submittedSearchText },
    queryKey: ['search', 'media', submittedSearchText],
  });

  useEffect(() => {
    if (!seriesId && !seasonId && !movieId) return;

    const searchText = buildDefaultSearchText(
      type,
      isShow,
      isSeason,
      series?.name,
      season?.name,
      movie?.name,
    );

    if (searchText === '') return;

    setSearchText(searchText);
    setSubmittedSearchText(searchText);

    // Focus the search button when the dialog is opened
    const timeout = setTimeout(() => {
      searchButtonRef.current?.focus();
    }, 0);

    return () => clearTimeout(timeout);
  }, [
    movie?.name,
    movieId,
    season?.name,
    seasonId,
    series?.name,
    seriesId,
    type,
    isSeason,
    isShow,
  ]);

  useEffect(() => {
    if (downloaded) {
      setDownloaded(false);
      closeDialog();
    }
  }, [downloaded, closeDialog, setDownloaded]);

  const downloadMedia = async (media: MediaSearchResult) => {
    const { mediaFolder, fileBaseName } = getDownloadTarget(isMovie, isSeason, movie, season, series);
    const fileName = fileBaseName + (type === 'music' ? 'theme' : 'video');

    await connectWS();

    if (type === 'music') {
      await downloadAudio(media.id, media.url, mediaFolder, fileName);
    } else {
      await downloadVideo(media.id, media.url, mediaFolder, fileName);
    }
  };

  const playMedia = (result: MediaSearchResult) => {
    setPlayerResult(result);
    setOpenPlayer(true);
  };

  const getVideoId = (url: string) => {
    return url.match(/(?:v=|\/embed\/|\.be\/)([\w-]{11})/)?.[1];
  };

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
          <Button onClick={() => setSubmittedSearchText(searchText)} ref={searchButtonRef}>
            {t('searchButton')}
          </Button>
        </FlexBox>
      </FlexBox>

      <FlexBox direction="column" scroll="vertical" hideScrollbar height={'100%'} width={'100%'}>
        {/* Results List */}
        {renderResults(
          searching,
          Boolean(searchError),
          searchResults,
          t('noResults'),
          playMedia,
          downloadMedia,
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
              />
            ),
          },
        ]}
        isOpen={openPlayer}
        close={() => setOpenPlayer(false)}
        hideButtons
      />
    </FlexBox>
  );
}

export default DownloadMediaSearch;
