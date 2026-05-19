import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useEffect } from 'react';
import FlexBox from '@/shared/components/ui/flex-box';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import DetailsActionButtons from './details-action-buttons';
import DetailsHeader from './details-header';
import type { DetailsInfoProps } from './details-info.types';
import DetailsSummary from './details-summary';
import DetailsTechnicalInfo from './details-technical-info';

function DetailsInfo({
  details,
  subtitle,
  infoItems,
  durationInfo,
  timeWatchedInfo,
  customDescription,
  handlePlay,
  handleMoreOptions,
  handleMarkWatched,
  handleToggleHideThumbnails,
  isWatched,
  hideUnwatchedThumbnails,
  videoInfo,
  audioInfo,
  subtitleInfo,
  hideButtons,
  enableKeyboardBack = true,
  disableInitialFocus = false,
}: DetailsInfoProps) {
  useKeyboardBack({ enabled: enableKeyboardBack });

  useEffect(() => {
    if (disableInitialFocus) {
      return;
    }
    setFocus(NavigationFocusKeys.details.playButton);
  }, [disableInitialFocus]);

  return (
    <FlexBox direction="column" justify="end" width={'100%'} className="z-50" padding="0 4rem">
      <DetailsHeader details={details} subtitle={subtitle} />
      <DetailsSummary
        details={details}
        infoItems={infoItems}
        durationInfo={durationInfo}
        timeWatchedInfo={timeWatchedInfo}
        customDescription={customDescription}
      />

      {!hideButtons && (
        <FlexBox
          className="flex-row"
          width={'100%'}
          justify="space-between"
          align="center"
          css={{
            paddingTop: 50,
            gap: 10,
          }}
        >
          <DetailsActionButtons
            handlePlay={handlePlay}
            handleMoreOptions={handleMoreOptions}
            handleMarkWatched={handleMarkWatched}
            handleToggleHideThumbnails={handleToggleHideThumbnails}
            timeWatchedInfo={timeWatchedInfo}
            isWatched={isWatched}
            hideUnwatchedThumbnails={hideUnwatchedThumbnails}
          />
          <DetailsTechnicalInfo
            videoInfo={videoInfo}
            audioInfo={audioInfo}
            subtitleInfo={subtitleInfo}
          />
        </FlexBox>
      )}
    </FlexBox>
  );
}

export default DetailsInfo;
