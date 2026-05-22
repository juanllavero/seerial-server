import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { useEffect } from 'react';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationContainer } from '../navigation';
import NavigationButton from '../navigation/navigation-button';

export interface ContextMenuItem {
  label: string;
  action: () => void;
}

const MENU_FOCUS_KEY = 'CARD_CONTEXT_MENU';

interface CardContextMenuProps {
  title?: string;
  items: ContextMenuItem[];
  onClose: () => void;
  /** Focus key to restore when the menu closes. */
  previousFocusKey?: string;
}

function CardContextMenu({ title, items, onClose, previousFocusKey }: CardContextMenuProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: MENU_FOCUS_KEY,
    trackChildren: true,
    isFocusBoundary: true,
    preferredChildFocusKey: `${MENU_FOCUS_KEY}_ITEM_0`,
  });

  // When the menu opens the user may still be holding Enter (long press).
  // Block repeat keydown events for Enter at the capture phase so neither
  // Norigin nor the item's onKeyDown handler fires until the key is released.
  useEffect(() => {
    const blockRepeatEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.repeat) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    setFocus(`${MENU_FOCUS_KEY}_ITEM_0`);

    window.addEventListener('keydown', blockRepeatEnter, { capture: true });
    return () => window.removeEventListener('keydown', blockRepeatEnter, { capture: true });
  }, []);

  const handleClose = () => {
    onClose();
    if (previousFocusKey) {
      setFocus(previousFocusKey);
    }
  };

  useKeyboardBack({
    preAction: handleClose,
    navigateOnBack: false,
    capture: true,
  });

  return (
    // biome-ignore lint/a11y/useSemanticElements: fullscreen overlay cannot be a native button because it contains interactive descendants
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClose();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <FocusContext.Provider value={focusKey}>
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className="min-w-[38dvh] max-w-[50dvh] rounded-xl border border-white/20 bg-neutral-950 p-2 shadow-2xl"
        >
          {title && (
            <div className="truncate border-b border-white/10 px-5 py-2 text-[2.4vh] font-medium text-white/50">
              {title}
            </div>
          )}
          <NavigationContainer
            focusBoundaryDirections={['up', 'down', 'left', 'right']}
            isFocusBoundary
            className="flex max-h-[30dvh] flex-col gap-1 overflow-y-auto p-2"
          >
            {items.map((item, index) => (
              <NavigationButton
                key={item.label}
                text={item.label}
                variant="ghost"
                customKey={`${MENU_FOCUS_KEY}_ITEM_${index}`}
                onClick={() => {
                  item.action();
                  handleClose();
                }}
              />
            ))}
          </NavigationContainer>
        </div>
      </FocusContext.Provider>
    </div>
  );
}

export default CardContextMenu;
