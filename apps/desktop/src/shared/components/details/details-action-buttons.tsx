import { Ellipsis, LucideBookmark, PlayIcon } from 'lucide-react';
import NavigationButton from '@/components/navigation/NavigationButton';
import FlexBox from '@/components/ui/FlexBox';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

interface DetailsActionButtonsProps {
  handlePlay?: () => void;
  handleMoreOptions: () => void;
}

function DetailsActionButtons({ handlePlay, handleMoreOptions }: DetailsActionButtonsProps) {
  return (
    <FlexBox gap={1}>
      <NavigationButton
        customKey={NavigationFocusKeys.details.playButton}
        text={'Reproducir'}
        icon={<PlayIcon size={'3dvh'} />}
        onClick={handlePlay}
        hideText
        animateText
      />
      <NavigationButton
        customKey={NavigationFocusKeys.details.markWatchedButton}
        text={'Marcar como visto'}
        icon={<LucideBookmark size={'3vh'} />}
        onClick={() => console.log('Mark as watched')}
        hideText
        animateText
      />
      <NavigationButton
        customKey={NavigationFocusKeys.details.addToMyListButton}
        text={'Agregar a mi lista'}
        icon={<LucideBookmark size={'3dvh'} />}
        onClick={() => console.log('Add to my list')}
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
