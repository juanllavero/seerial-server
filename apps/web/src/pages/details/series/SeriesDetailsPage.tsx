import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { mutate } from 'swr';
import { shallow } from 'zustand/shallow';
import ExpandableText from '@/components/ExpandableText';
import { useIsMobile } from '@/components/hooks/use-mobile';
import NotFound from '@/components/NotFound';
import { Button } from '@/components/ui/button';
import FlexBox from '@/components/ui/FlexBox';
import { MarkWatchedIcon, UnmarkWatchedIcon } from '@/components/ui/IconLibrary';
import LazyImage from '@/components/ui/LazyImage';
import { Skeleton } from '@/components/ui/skeleton';
import { API, authenticatedFetch } from '@/config/api';
import { useServerStore } from '@/context/auth.store';
import useDataStore from '@/context/data.context';
import { useDialogStore } from '@/context/dialog.store';
import { useSettingsStore } from '@/context/settings.context';
import type { Series } from '@/data/interfaces/Media';
import { useGet } from '@/hooks/media/useGet';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import CastList from '../components/CastList';
import '../DetailsPage.css';
import MyListButton from './components/MyListButton';
import PlayButton from './components/PlayButton';
import SeasonSelectable from './components/SeasonSelectable';
import SeasonContent from './components/SeasonsContent';

function SeriesDetailsPage() {
  const { seriesId } = useParams();
  const { selectedSeasonId, selectSeason, setCurrentBackground, currentBackground } = useDataStore(
    (state) => ({
      selectedSeasonId: state.selectedSeasonId,
      selectSeason: state.selectSeason,
      setCurrentBackground: state.setCurrentBackground,
      currentBackground: state.currentBackground,
    }),
    shallow,
  );
  const isAdmin = useIsAdmin();
  const { user } = useServerStore(
    (state) => ({
      user: state.currentUser,
    }),
    shallow,
  );
  const clientSettings = useSettingsStore((state) => state.clientSettings);
  const { openDialog } = useDialogStore((state) => ({ openDialog: state.openDialog }), shallow);

  // Get series data
  const {
    data: series,
    isLoading,
    error,
  } = useGet<Series>(`${API.series.get(seriesId ?? '')}?include=all`);

  // Get selected season data
  const season =
    series && series.seasons ? series.seasons.find((s) => s.id === selectedSeasonId) : undefined;

  const isMobile = useIsMobile();
  const showPoster: boolean = (clientSettings.showPosters as boolean) ?? true;

  useEffect(() => {
    if (!isLoading && series && ((season && season.id !== selectedSeasonId) || !season)) {
      selectSeason(series.seasons && series.seasons.length > 0 ? series.seasons[0].id : null);
    }
  }, [series, season, isLoading, selectedSeasonId, selectSeason]);

  // Set background image src
  useEffect(() => {
    if (season && season.backgroundSrc !== currentBackground) {
      setCurrentBackground(season.backgroundSrc);
    }
    // } else if (currentBackground) {
    //   setCurrentBackground(undefined)
    // }
  }, [season, setCurrentBackground, currentBackground]);

  const renderLogoOrText = () => {
    if (isLoading || !series) {
      return <Skeleton style={{ width: '350px', height: '200px' }} />;
    }

    const logoUrl = series.logoSrc;

    if (logoUrl && logoUrl !== '') {
      return (
        <LazyImage
          url={logoUrl}
          maxHeight={isMobile ? '100%' : 200}
          width={isMobile ? '100%' : 350}
          errorSrc="/img/Default_video_thumbnail.jpg"
        />
      );
    } else {
      return (
        <span
          id="details-title"
          style={{
            textTransform: 'uppercase',
          }}
        >
          {series.name}
        </span>
      );
    }
  };

  const toggleSeasonWatched = async () => {
    if (season) {
      authenticatedFetch(API.seasons.setWatchState(season.id), 'POST', {
        seasonId: season.id,
        watched: !season.watchStatus,
        userId: user?.id,
      }).then(() => {
        mutate((key: string) => key.startsWith(API.series.get(seriesId ?? '')));
        mutate((key: string) => key.startsWith(API.seasons.get(season.id)));
      });
    }
  };

  const selectSeasonOption = (key: string, _value: string) => {
    selectSeason(series?.seasons[Number(key)]?.id || null);
  };

  if (error) {
    return <NotFound />;
  }

  return (
    <FlexBox
      className="details-container"
      direction="column"
      gap={1}
      wrap="nowrap"
      padding={isMobile ? '3rem 0' : '2rem 3rem 5rem 3rem'}
      height={'100%'}
    >
      <FlexBox justify="start" align="start" gap={4}>
        {!isMobile && (
          <div className="cover-container">
            {showPoster &&
              (isLoading || !series ? (
                <FlexBox className="image-container">
                  <Skeleton style={{ height: '495px', width: '330px' }} />
                </FlexBox>
              ) : (
                <FlexBox className="image-container">
                  <LazyImage
                    url={series.coverSrc}
                    width={330}
                    maxHeight={495}
                    height={495}
                    errorSrc={'/img/fileNotFound.jpg'}
                  />
                </FlexBox>
              ))}
          </div>
        )}

        <FlexBox
          direction="column"
          gap={1}
          width={isMobile ? '100%' : '80%'}
          padding={isMobile ? '0 2rem' : '0'}
        >
          {renderLogoOrText()}

          {/* Season Title */}
          {isLoading || !series ? (
            <Skeleton className="h-8 w-60" />
          ) : series.seasons && series.seasons.length > 1 && season ? (
            <SeasonSelectable
              defaultValue={season ? season.name : series.seasons[0].name}
              options={series.seasons
                .sort((a, b) => a.seasonNumber - b.seasonNumber)
                .map((season, index) => {
                  return {
                    key: String(index),
                    value: season.name,
                  };
                })}
              onValueChange={selectSeasonOption}
            />
          ) : null}

          {/* Info */}
          <FlexBox direction="column" gap={0.2}>
            <FlexBox gap={1.3} margin="0 0 0.3rem 0">
              <span id="date">
                {isLoading || !series ? (
                  <Skeleton className="h-5 w-20" />
                ) : season ? (
                  new Date(season.year).getFullYear()
                ) : null}
              </span>
            </FlexBox>
            <span id="genres">
              {isLoading ? (
                <Skeleton className="h-5 w-40" />
              ) : series && series.genres && series.genres.length > 0 ? (
                series.genres.join(', ') || ''
              ) : null}
            </span>
          </FlexBox>

          {/* Score */}
          <FlexBox gap={0.5} justify="center" align="center">
            <img src="/svg/themoviedb.svg" className="h-8 w-8" alt="TheMovieDB logo" />
            <span className="text-sm font-bold">
              {isLoading ? (
                <Skeleton className="h-5 w-8" />
              ) : series ? (
                series.score.toFixed(2)
              ) : (
                'N/A'
              )}
            </span>
          </FlexBox>
          <FlexBox gap={1} wrap="wrap">
            <PlayButton
              selectedSeasonId={selectedSeasonId}
              currentlyWatchingEpisodeId={series ? series.currentlyWatchingEpisodeId : undefined}
            />
            {!isMobile && (
              <>
                <Button
                  variant={'ghost'}
                  title={season && season.watchStatus ? t('markUnwatched') : t('markWatched')}
                  onClick={toggleSeasonWatched}
                >
                  {season && season.watchStatus ? <UnmarkWatchedIcon /> : <MarkWatchedIcon />}
                </Button>
                <MyListButton seriesId={seriesId ?? ''} />
              </>
            )}
            {isAdmin && (
              <Button
                variant={'ghost'}
                title={t('editButton')}
                onClick={() => {
                  if (season) {
                    openDialog('season', { id: season.id });
                  }
                }}
              >
                <Pencil />
              </Button>
            )}
            {/* <Button
              variant={'ghost'}
              // onClick={(e) => {
              //   dispatch(toggleSeasonMenu())
              //   if (!seasonMenuOpen) cm.current?.show(e)
              // }}
            >
              <Ellipsis />
            </Button> */}
          </FlexBox>
          <FlexBox>
            <span className="max-w-300 font-semibold">
              {isLoading ? (
                <Skeleton className="h-30 w-90" />
              ) : season ? (
                <ExpandableText text={season.overview} />
              ) : series ? (
                <ExpandableText text={series.overview} />
              ) : (
                ''
              )}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      {/* Season Content */}
      {isLoading || !series || !season ? <Skeleton className="h-300 w-200" /> : <SeasonContent />}

      {/* Cast */}
      {isLoading || !series ? (
        <Skeleton className="h-100 w-200" />
      ) : (
        <CastList cast={series.cast ?? []} />
      )}
    </FlexBox>
  );
}

export default SeriesDetailsPage;
