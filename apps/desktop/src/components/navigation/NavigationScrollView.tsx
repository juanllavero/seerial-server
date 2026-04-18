import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { type ScrollMode, useAutoScroll } from '@/hooks/useAutoScroll';
import '@/styles/utils.css';
import { DESKTOP_PADDING_LEFT } from '@seerial/domain';
import { memo, useRef } from 'react';

interface NavigationScrollViewProps {
  children: React.ReactNode;
  className?: string;
  customFocusKey?: string;
  direction?: 'horizontal' | 'vertical';
  style?: React.CSSProperties;
  scrollMode?: ScrollMode;
  focusedElementId?: string;
  isRestoringFocus?: boolean;
  isFocusBoundary?: boolean;
  focusBoundaryDirections?: ('left' | 'right' | 'up' | 'down')[];
}

const NavigationScrollView = ({
  children,
  className,
  customFocusKey,
  direction = 'horizontal',
  style,
  scrollMode = 'start',
  focusedElementId,
  isRestoringFocus = true,
  isFocusBoundary = false,
  focusBoundaryDirections,
}: NavigationScrollViewProps) => {
  const { ref, focusKey } = useFocusable({
    trackChildren: true,
    focusKey: customFocusKey,
    saveLastFocusedChild: true,
    isFocusBoundary,
    focusBoundaryDirections,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  useAutoScroll({
    scrollMode,
    scrollAxis: direction === 'horizontal' ? 'horizontal' : 'vertical',
    focusedElementId,
    containerRef,
    isRestoringFocus,
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={(node) => {
          containerRef.current = node;
          if (ref && node && typeof ref !== 'function') {
            const refObject = ref as React.RefObject<HTMLDivElement | null>;
            refObject.current = node;
          }
        }}
        className={`
          flex h-fit hide-scrollbar
          ${direction === 'horizontal' ? 'flex-row overflow-x-auto overflow-y-hidden' : 'flex-col overflow-y-auto overflow-x-hidden'}
          ${isRestoringFocus ? 'scroll-auto' : 'scroll-smooth'}
          ${className || ''}
        `}
        style={{
          ...style,
          paddingLeft: direction === 'horizontal' ? DESKTOP_PADDING_LEFT : 0,
          paddingRight: direction === 'horizontal' ? DESKTOP_PADDING_LEFT : 0,
        }}
      >
        {children}
      </div>
    </FocusContext.Provider>
  );
};

export default memo(NavigationScrollView);
