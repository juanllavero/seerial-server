import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation';

function NavigationContainer({
  children,
  className,
  customFocusKey,
  isFocusBoundary = false,
  focusBoundaryDirections,
  onFocus,
  onBlur,
}: {
  children: React.ReactNode;
  className?: string;
  customFocusKey?: string;
  isFocusBoundary?: boolean;
  focusBoundaryDirections?: ('left' | 'right' | 'up' | 'down')[];
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const { ref, focusKey } = useFocusable({
    trackChildren: true,
    focusKey: customFocusKey,
    saveLastFocusedChild: true,
    isFocusBoundary,
    focusBoundaryDirections,
    onFocus,
    onBlur,
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </FocusContext.Provider>
  );
}

export default NavigationContainer;
