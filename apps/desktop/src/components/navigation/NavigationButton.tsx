import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { memo } from 'react';
import { Button } from '../ui/button';

interface FocusableButtonProps {
  text?: string;
  title?: string;
  className?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onFocus?: () => void;
  onArrowPress?: (direction: string) => boolean | undefined;
  customKey?: string;
  transparent?: boolean;
}

function FocusableButton({
  text,
  title,
  icon,
  className,
  children,
  disabled,
  onClick,
  onFocus,
  onArrowPress,
  customKey,
  transparent = true,
}: FocusableButtonProps) {
  const { ref, focused } = useFocusable({
    onEnterPress: onClick,
    onFocus,
    onArrowPress: onArrowPress
      ? (direction) => {
          const shouldContinueNavigation = onArrowPress(direction);

          return shouldContinueNavigation ?? true;
        }
      : undefined,
    focusKey: customKey,
  });

  return (
    <Button
      ref={ref}
      title={title}
      className={`${className} transition-all duration-200 ease-linear rounded-full bg-muted-foreground text-black hover:text-black ${focused ? 'bg-primary text-black' : transparent ? 'text-white bg-transparent' : ''}`}
      disabled={disabled}
      onClick={onClick}
      style={{ fontWeight: '500' }}
    >
      {icon}
      {text}
      {children}
    </Button>
  );
}

export default memo(FocusableButton);
