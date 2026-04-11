import type { DetailsData } from '@seerial/domain';
import Tertiary from '@/components/text/Tertiary';
import FlexBox from '@/components/ui/FlexBox';
import DetailsRating from './details-rating';
import DetailsWatchProgressBadge from './details-watch-progress-badge';

interface DetailsSummaryProps {
  details: DetailsData | undefined;
  infoItems?: string[];
  durationInfo?: number;
  timeWatchedInfo?: number;
  hideButtons?: boolean;
}

function DetailsSummary({
  details,
  infoItems,
  durationInfo,
  timeWatchedInfo,
  hideButtons,
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

      {details?.description && (
        <FlexBox
          css={{
            maxWidth: 1000,
            height: hideButtons ? '8dvh' : '12dvh',
            paddingTop: 3,
          }}
        >
          <Tertiary
            className={`${hideButtons ? 'line-clamp-3' : 'line-clamp-4'} ellipsis`}
            style={{ color: 'var(--text-secondary)' }}
          >
            {details.description}
          </Tertiary>
        </FlexBox>
      )}
    </FlexBox>
  );
}

export default DetailsSummary;
