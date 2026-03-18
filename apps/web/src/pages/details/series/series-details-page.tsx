import { API, useCreate, useGet } from '@seerial/api';
import type { Season, Series } from '@seerial/domain';
import { useIsAdmin } from '@seerial/hooks';
import { useDataStore, useServerStore } from '@seerial/stores';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { useDialogStore } from '@/features/management';
import {
  CastList,
  SeriesMyListButton as MyListButton,
  SeriesPlayButton as PlayButton,
  SeriesSeasonContent as SeasonContent,
  SeriesSeasonSelectable as SeasonSelectable,
} from '@/features/media-details';
import { useSettingsStore } from '@/features/settings';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Button } from '@/shared/ui/button';
import ExpandableText from '@/shared/ui/expandable-text';
import FlexBox from '@/shared/ui/flex-box';
import { MarkWatchedIcon, UnmarkWatchedIcon } from '@/shared/ui/icon-library';
import LazyImage from '@/shared/ui/lazy-image';
import NotFound from '@/shared/ui/not-found';
import { Skeleton } from '@/shared/ui/skeleton';
import '../details-page';

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
    mutate: mutateSeries,
  } = useGet<Series>(`${API.series.get(seriesId ?? '')}?include=all`);
  const { create } = useCreate<unknown>();

  // Get selected season data
  const season = series?.seasons
    ? series.seasons.find((s: Season) => s.id === selectedSeasonId)
    : undefined;

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
      await create(API.seasons.setWatchState(season.id), {
        seasonId: season.id,
        watched: !season.watchStatus,
        userId: user?.id,
      });

      mutateSeries();
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
                .sort((a: Season, b: Season) => a.seasonNumber - b.seasonNumber)
                .map((season: Season, index: number) => {
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
              ) : series?.genres && series.genres.length > 0 ? (
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
                  title={season?.watchStatus ? t('markUnwatched') : t('markWatched')}
                  onClick={toggleSeasonWatched}
                >
                  {season?.watchStatus ? <UnmarkWatchedIcon /> : <MarkWatchedIcon />}
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
