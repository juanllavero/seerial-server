import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import NotFound from '@/components/NotFound'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { API } from '@/config/api'
import useDataStore from '@/context/data.context'
import { Season } from '@/data/interfaces/Media'
import { SelectableOption } from '@/data/interfaces/Utils'
import { useGet } from '@/hooks/media/useGet'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { shallow } from 'zustand/shallow'
import EpisodesList from './EpisodesList'

function SeasonContent() {
  const { t } = useTranslation()
  const { selectedSeasonId } = useDataStore(
    (state) => ({
      selectedSeasonId: state.selectedSeasonId,
    }),
    shallow,
  )
  const [distribution, setDistribution] = React.useState(0)
  const prevDistribution = useRef(distribution)
  const distributionOptions: SelectableOption[] = [
    {
      key: '0',
      value: t('grid'),
    },
    {
      key: '1',
      value: t('list'),
    },
  ]
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const {
    data: season,
    isLoading,
    error,
    mutate,
  } = useGet<Season>(
    selectedSeasonId ? API.seasons.get(selectedSeasonId, 'all') : null,
  )

  useEffect(() => {
    if ((isTablet || isMobile) && distribution !== 1) {
      prevDistribution.current = distribution
      setDistribution(1)
    } else if (
      !isTablet &&
      !isMobile &&
      distribution !== prevDistribution.current
    ) {
      setDistribution(prevDistribution.current)
    }
  }, [isMobile, isTablet, setDistribution, distribution])

  const selectDistributionOption = (key: string, _value: string) => {
    prevDistribution.current = Number(key)
    setDistribution(Number(key))
  }

  // Loading Skeleton
  if (isLoading) {
    return (
      <FlexBox
        direction="column"
        gap={2}
        margin="1rem 0 0 0"
        padding={isMobile ? '1rem 2rem' : '0'}
        width={'100%'}
      >
        <FlexBox width={'100%'} justify="space-between" align="start">
          <FlexBox direction="column" gap={2}>
            <Skeleton />
          </FlexBox>

          {!isMobile && <Skeleton />}
        </FlexBox>
        {distribution === 0 ? (
          <Grid
            columns={
              isMobile
                ? 'repeat(auto-fill, minmax(200px, 1fr))'
                : 'repeat(auto-fill, minmax(400px, 1fr))'
            }
            gap="1rem"
            width="100%"
          >
            <Skeleton />
          </Grid>
        ) : (
          <FlexBox direction="column" gap={0.5}>
            <Skeleton />
          </FlexBox>
        )}
      </FlexBox>
    )
  }

  // No content
  if (!season || error) {
    return <NotFound />
  }

  // Episodes
  return (
    <FlexBox
      direction="column"
      gap={2}
      margin="1rem 0 0 0"
      padding={isMobile ? '1rem 2rem' : '0'}
      width={'100%'}
    >
      <FlexBox width={'100%'} justify="space-between" align="start">
        <span className="text-2xl font-semibold">{t('episodes')}</span>

        {!isMobile && !isTablet && (
          <SelectableWrapper
            key={'Distribution ' + distribution}
            defaultValue={distributionOptions[distribution].value}
            width="w-fit"
            options={distributionOptions}
            onValueChange={selectDistributionOption}
          />
        )}
      </FlexBox>

      {season.episodes.length === 0 ? (
        <span>{t('noEpisodes')}</span>
      ) : (
        <EpisodesList
          episodes={season.episodes}
          distribution={distribution}
          seriesId={season.seriesId}
          seasonId={season.id}
          mutate={mutate}
        />
      )}
    </FlexBox>
  )
}

export default SeasonContent
