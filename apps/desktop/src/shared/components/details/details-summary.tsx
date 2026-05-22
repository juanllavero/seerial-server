import type { DetailsData } from '@seerial/domain';
import { useState } from 'react';
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
  clickableDescription?: boolean;
  onDescriptionClick?: () => void;
}

function DetailsSummary({
  details,
  infoItems,
  durationInfo,
  timeWatchedInfo,
  customDescription,
  clickableDescription = false,
  onDescriptionClick,
}: DetailsSummaryProps) {
  const [descriptionFocused, setDescriptionFocused] = useState(false);
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
            maxWidth: '80dvh',
            height: '8dvh',
            paddingTop: 3,
          }}
        >
          {clickableDescription ? (
            <NavigationButton
              customKey={NavigationFocusKeys.details.descriptionButton}
              title={descriptionText}
              onClick={onDescriptionClick}
              onFocus={() => setDescriptionFocused(true)}
              onBlur={() => setDescriptionFocused(false)}
              variant="ghost"
              className="h-[10dvh] w-full max-h-none! justify-start! items-start! rounded-lg! p-0! whitespace-normal!"
            >
              <div className="w-full overflow-hidden">
                <Tertiary
                  className="line-clamp-3! text-left"
                  style={{
                    color: descriptionFocused ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {descriptionText}
                </Tertiary>
              </div>
            </NavigationButton>
          ) : (
            <Tertiary
              className="line-clamp-3 ellipsis text-left"
              style={{ color: 'var(--text-secondary)' }}
            >
              {descriptionText}
            </Tertiary>
          )}
        </FlexBox>
      )}
    </FlexBox>
  );
}

export default DetailsSummary;
