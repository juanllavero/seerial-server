import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import type { CSSProperties } from 'react';
import { memo } from 'react';
import Tertiary from '../text/tertiary';
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
  onBlur?: () => void;
  onArrowPress?: (direction: string) => boolean | undefined;
  customKey?: string;
  selected?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  hideText?: boolean;
  animateText?: boolean;
}

function getTextColor(focused: boolean, selected: boolean): string {
  if (focused) return 'black';
  if (selected) return 'var(--app-color)';
  return 'white';
}

function getBackgroundColor(focused: boolean, selected: boolean, variant: string): string {
  if (focused) return 'white';
  if (variant === 'ghost' || selected) return 'transparent';
  return 'var(--muted)';
}

function AnimatedText({
  visible,
  textColor,
  hasIcon,
  text,
}: {
  visible: boolean;
  textColor: string;
  hasIcon: boolean;
  text: string;
}) {
  const style: CSSProperties = {
    display: 'inline-block',
    maxWidth: visible ? '500px' : '0px',
    opacity: visible ? 1 : 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    transition: 'max-width 300ms ease, opacity 150ms ease',
  };

  return (
    <span style={style}>
      <Tertiary style={{ color: textColor }} className={hasIcon ? 'ml-4' : ''}>
        {text}
      </Tertiary>
    </span>
  );
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
  onBlur,
  onArrowPress,
  customKey,
  selected = false,
  variant = 'primary',
  hideText = false,
  animateText = false,
}: FocusableButtonProps) {
  const { ref, focused } = useFocusable({
    onEnterPress: onClick,
    onFocus,
    onBlur,
    onArrowPress: onArrowPress
      ? (direction) => {
          const shouldContinueNavigation = onArrowPress(direction);

          return shouldContinueNavigation ?? true;
        }
      : undefined,
    focusKey: customKey,
  });

  const textColor = getTextColor(focused, selected);
  const backgroundColor = getBackgroundColor(focused, selected, variant);
  const rounded = (icon && hideText && !focused) || (!icon && !text);
  const shouldAnimate = animateText && hideText;
  const showText = !hideText || focused;

  return (
    <Button
      ref={ref}
      size={null}
      title={title}
      data-focus-key={customKey}
      className={`${className} max-h-[5vh] ${rounded ? 'p-4' : 'px-8 py-4'}
      rounded-full text-black hover:text-black `}
      style={{
        color: textColor,
        backgroundColor,
        transition: shouldAnimate ? 'padding 200ms ease' : undefined,
      }}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {shouldAnimate && text ? (
        <AnimatedText visible={showText} textColor={textColor} hasIcon={!!icon} text={text} />
      ) : (
        showText &&
        text && (
          <Tertiary style={{ color: textColor }} className={icon ? 'ml-4' : ''}>
            {text}
          </Tertiary>
        )
      )}
      {children}
    </Button>
  );
}

export default memo(FocusableButton);
