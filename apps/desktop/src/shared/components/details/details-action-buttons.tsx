import { Ellipsis, Eye, EyeOff, PlayIcon, RotateCcw } from 'lucide-react';
import { useRelatedContent } from '@/features/details';
import FlexBox from '@/shared/components/ui/flex-box';
import { MarkWatchedIcon, UnmarkWatchedIcon } from '@/shared/components/ui/icon-library';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import NavigationButton from '../navigation/navigation-button';

interface DetailsActionButtonsProps {
  handlePlay?: () => void;
  handleMoreOptions?: () => void;
  handleMarkWatched?: () => void;
  handleToggleHideThumbnails?: () => void;
  timeWatchedInfo?: number;
  isWatched?: boolean;
  hideUnwatchedThumbnails?: boolean;
}

function DetailsActionButtons({
  handlePlay,
  handleMoreOptions,
  handleMarkWatched,
  handleToggleHideThumbnails,
  timeWatchedInfo,
  isWatched,
  hideUnwatchedThumbnails,
}: DetailsActionButtonsProps) {
  const { navigateToRelated, hasRelatedContent } = useRelatedContent();
  return (
    <FlexBox gap={1}>
      <NavigationButton
        customKey={NavigationFocusKeys.details.playButton}
        text={'Reproducir'}
        icon={<PlayIcon size={'3dvh'} fill="currentColor" stroke="currentColor" />}
        onClick={handlePlay}
        hideText
        animateText
      />
      {timeWatchedInfo !== undefined && timeWatchedInfo > 0 && (
        <NavigationButton
          customKey={NavigationFocusKeys.details.playFromStartButton}
          text={'Reproducir desde el principio'}
          icon={<RotateCcw size={'3dvh'} stroke="currentColor" />}
          onClick={handleMarkWatched}
          hideText
          animateText
        />
      )}
      <NavigationButton
        customKey={NavigationFocusKeys.details.markWatchedButton}
        text={isWatched ? 'Desmarcar como visto' : 'Marcar como visto'}
        icon={isWatched ? <UnmarkWatchedIcon /> : <MarkWatchedIcon />}
        onClick={handleMarkWatched}
        hideText
        animateText
      />
      {handleToggleHideThumbnails && (
        <NavigationButton
          customKey={NavigationFocusKeys.details.hideThumbnailsButton}
          text={hideUnwatchedThumbnails ? 'Mostrar carátulas' : 'Ocultar carátulas'}
          icon={
            hideUnwatchedThumbnails ? (
              <EyeOff size={'3dvh'} stroke="currentColor" />
            ) : (
              <Eye size={'3dvh'} stroke="currentColor" />
            )
          }
          onClick={handleToggleHideThumbnails}
          hideText
          animateText
        />
      )}
      <NavigationButton
        customKey={NavigationFocusKeys.details.optionsButton}
        text={'Más'}
        icon={<Ellipsis size={'3dvh'} />}
        onClick={handleMoreOptions}
        onArrowPress={
          hasRelatedContent
            ? (direction) => {
                if (direction === 'right') {
                  navigateToRelated();
                  return false;
                }
                return true;
              }
            : undefined
        }
        hideText
        animateText
      />
    </FlexBox>
  );
}

export default DetailsActionButtons;
