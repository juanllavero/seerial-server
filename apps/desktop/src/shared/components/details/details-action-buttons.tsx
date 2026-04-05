import { Ellipsis, LucideBookmark, PlayIcon } from 'lucide-react';
import NavigationButton from '@/components/navigation/NavigationButton';
import FlexBox from '@/components/ui/FlexBox';
import { MarkWatchedIcon, UnmarkWatchedIcon } from '@/components/ui/IconLibrary';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

interface DetailsActionButtonsProps {
  handlePlay?: () => void;
  handleMoreOptions?: () => void;
  handleMarkWatched?: () => void;
  handleAddToMyList?: () => void;
  isWatched?: boolean;
  isInMyList?: boolean;
}

function DetailsActionButtons({
  handlePlay,
  handleMoreOptions,
  handleMarkWatched,
  handleAddToMyList,
  isWatched,
  isInMyList,
}: DetailsActionButtonsProps) {
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
      <NavigationButton
        customKey={NavigationFocusKeys.details.markWatchedButton}
        text={isWatched ? 'Desmarcar como visto' : 'Marcar como visto'}
        icon={isWatched ? <UnmarkWatchedIcon /> : <MarkWatchedIcon />}
        onClick={handleMarkWatched}
        hideText
        animateText
      />
      <NavigationButton
        customKey={NavigationFocusKeys.details.addToMyListButton}
        text={isInMyList ? 'Eliminar de mi lista' : 'Agregar a mi lista'}
        icon={
          <LucideBookmark
            size={'3dvh'}
            fill={isInMyList ? 'currentColor' : 'transparent'}
            stroke="currentColor"
          />
        }
        onClick={handleAddToMyList}
        hideText
        animateText
      />
      <NavigationButton
        customKey={NavigationFocusKeys.details.optionsButton}
        icon={<Ellipsis size={'3dvh'} />}
        onClick={handleMoreOptions}
        hideText
        animateText
      />
    </FlexBox>
  );
}

export default DetailsActionButtons;
