import { API, useGet, useGetSeries, useUpdateSeriesEpisodeGroup } from '@seerial/api';
import type { Series } from '@seerial/domain';
import { useWebSocketStore } from '@seerial/stores';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import Loading from '@/components/Loading';
import FlexBox from '@/components/ui/FlexBox';
import { useDialogStore } from '@/context/dialog.store';
import { getEpisodeGroupType } from '@/utils/ReactUtils';
import './ChangeEpisodesGroupSearch.css';

interface EpisodeGroupResult {
  description: string;
  episode_count: number;
  group_count: number;
  id: string;
  name: string;
  network: null;
  type: number;
}

function ChangeEpisodesGroupSearch() {
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
  const seriesId =
    open === 'episodesGroup' && payload && 'seriesId' in payload ? payload.seriesId : undefined;

  const { data: series } = useGetSeries<Series>(seriesId ?? '', {
    enabled: Boolean(seriesId),
  });

  const { mutateAsync: updateEpisodeGroup } = useUpdateSeriesEpisodeGroup(seriesId ?? '');

  const searchUrl = series?.themdbId
    ? `${API.series.searchEpisodeGroups}?id=${series.themdbId}`
    : null;

  const { data: episodeGroupsResults, isLoading } = useGet<EpisodeGroupResult[]>(searchUrl, {
    enabled: Boolean(searchUrl),
  });

  const saveIdentification = async (id: string) => {
    await connectWS();
    await updateEpisodeGroup({
      themdbId: series?.themdbId,
      episodeGroupId: id,
    });

    closeDialog();
  };

  return (
    <FlexBox direction="column" gap={1} height={'35rem'} width={'35rem'}>
      <FlexBox direction="column" scroll="vertical" hideScrollbar height={'100%'} width={'100%'}>
        {/* Results List */}
        {isLoading ? (
          <Loading />
        ) : episodeGroupsResults && episodeGroupsResults.length > 0 ? (
          episodeGroupsResults.map((result: EpisodeGroupResult) => (
            <FlexBox
              className="episode-group-card"
              key={result.id}
              onClick={() => saveIdentification(result.id)}
              padding="1rem"
              width={'100%'}
              gap={1}
            >
              <FlexBox direction="column" gap={0.5}>
                <span className="font-semibold">
                  {result.name} ({getEpisodeGroupType(result.type)})
                </span>
                <span className="text-sm" style={{ color: 'lightgray' }}>
                  {result.group_count} {t('groups')}, {result.episode_count} {t('episodes')}
                </span>
                <span className="mt-1 line-clamp-4 text-ellipsis">{result.description}</span>
              </FlexBox>
            </FlexBox>
          ))
        ) : episodeGroupsResults && episodeGroupsResults.length === 0 ? (
          <span>{t('noResults')}</span>
        ) : (
          <Loading />
        )}
      </FlexBox>
    </FlexBox>
  );
}

export default ChangeEpisodesGroupSearch;
