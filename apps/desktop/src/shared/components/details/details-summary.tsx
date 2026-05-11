import type { DetailsData } from '@seerial/domain';
import FlexBox from '@/shared/components/ui/flex-box';
import { Tertiary } from '../text';
import DetailsRating from './details-rating';
import DetailsWatchProgressBadge from './details-watch-progress-badge';

interface DetailsSummaryProps {
  details: DetailsData | undefined;
  infoItems?: string[];
  durationInfo?: number;
  timeWatchedInfo?: number;
  customDescription?: string;
}

function DetailsSummary({
  details,
  infoItems,
  durationInfo,
  timeWatchedInfo,
  customDescription,
}: DetailsSummaryProps) {
  const hasWatchProgress =
    durationInfo !== undefined && timeWatchedInfo !== undefined && durationInfo > 0;

  return (
    <FlexBox gap={0.8} direction="column">
      {infoItems && infoItems.length > 0 ? (
        <FlexBox className="flex-row" gap={0.8} align="center">
          {infoItems.map((item, index) => (
            <Tertiary
              key={`Info item ${
                // biome-ignore lint/suspicious/noArrayIndexKey: <This is just display info>
                index
              }`}
            >
              {item}
            </Tertiary>
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

      {(customDescription || details?.description) && (
        <FlexBox
          css={{
            maxWidth: 1000,
            height: '8dvh',
            paddingTop: 3,
          }}
        >
          <Tertiary className={`line-clamp-3 ellipsis`} style={{ color: 'var(--text-secondary)' }}>
            {customDescription || details?.description}
          </Tertiary>
        </FlexBox>
      )}
    </FlexBox>
  );
}

export default DetailsSummary;
