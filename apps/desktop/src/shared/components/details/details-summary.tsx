import type { DetailsData } from '@seerial/domain';
import { NavigationButton } from '@/shared/components/navigation';
import FlexBox from '@/shared/components/ui/flex-box';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import Tertiary from '../text/tertiary';
import DetailsRating from './details-rating';
import DetailsWatchProgressBadge from './details-watch-progress-badge';

interface DetailsSummaryProps {
  details: DetailsData | undefined;
  infoItems?: string[];
  durationInfo?: number;
  timeWatchedInfo?: number;
  customDescription?: string;
  onDescriptionClick?: () => void;
}

function DetailsSummary({
  details,
  infoItems,
  durationInfo,
  timeWatchedInfo,
  customDescription,
  onDescriptionClick,
}: DetailsSummaryProps) {
  const hasWatchProgress =
    durationInfo !== undefined && timeWatchedInfo !== undefined && durationInfo > 0;

  const descriptionText = customDescription || details?.description;

  return (
    <FlexBox gap={0.8} direction="column">
      {infoItems && infoItems.length > 0 ? (
        <FlexBox className="flex-row" gap={0.8} align="center">
          {infoItems.map((item) => (
            <Tertiary key={`info-item-${item}`}>{item}</Tertiary>
          ))}

          {hasWatchProgress && (
            <DetailsWatchProgressBadge
              durationInfo={durationInfo}
              timeWatchedInfo={timeWatchedInfo}
            />
          )}
        </FlexBox>
      ) : null}

      <DetailsRating details={details} />

      {details?.genres && (
        <Tertiary style={{ color: 'var(--text-secondary)' }}>{details.genres}</Tertiary>
      )}

      {descriptionText && (
        <FlexBox
          css={{
            maxWidth: 1000,
            height: '8dvh',
            paddingTop: 3,
          }}
        >
          <NavigationButton
            customKey={NavigationFocusKeys.details.descriptionButton}
            title={descriptionText}
            onClick={onDescriptionClick}
            variant="ghost"
            className="h-full w-full max-h-none! justify-start! rounded-lg! p-0!"
          >
            <Tertiary
              className="line-clamp-3 ellipsis text-left"
              style={{ color: 'var(--text-secondary)' }}
            >
              {descriptionText}
            </Tertiary>
          </NavigationButton>
        </FlexBox>
      )}
    </FlexBox>
  );
}

export default DetailsSummary;
