import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { useEffect } from 'react';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';

export interface ContextMenuItem {
  label: string;
  action: () => void;
}

const MENU_FOCUS_KEY = 'CARD_CONTEXT_MENU';

interface MenuItemProps {
  label: string;
  focusKey: string;
  index: number;
  totalItems: number;
  onSelect: () => void;
}

function MenuItem({ label, focusKey, index, totalItems, onSelect }: MenuItemProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
    onArrowPress: (direction) => {
      if (direction === 'up' && index > 0) {
        setFocus(`${MENU_FOCUS_KEY}_ITEM_${index - 1}`);
      } else if (direction === 'down' && index < totalItems - 1) {
        setFocus(`${MENU_FOCUS_KEY}_ITEM_${index + 1}`);
      }
      // Always return false to prevent focus from leaving the menu
      return false;
    },
  });

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={`w-full cursor-pointer rounded-lg px-5 py-[1.2dvh] text-left text-[1.8vh] font-medium transition-colors ${
        focused ? 'bg-white text-black' : 'text-white hover:bg-white/10'
      }`}
    >
      {label}
    </div>
  );
}

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
  });

  useEffect(() => {
    setFocus(`${MENU_FOCUS_KEY}_ITEM_0`);
  }, []);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleClose}
    >
      <FocusContext.Provider value={focusKey}>
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className="min-w-[28dvh] max-w-[50dvh] rounded-xl border border-white/20 bg-neutral-900/95 p-2 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="truncate border-b border-white/10 px-5 py-2 text-[1.4vh] font-medium text-white/50">
              {title}
            </div>
          )}
          {items.map((item, index) => (
            <MenuItem
              key={item.label}
              label={item.label}
              focusKey={`${MENU_FOCUS_KEY}_ITEM_${index}`}
              index={index}
              totalItems={items.length}
              onSelect={() => {
                item.action();
                handleClose();
              }}
            />
          ))}
        </div>
      </FocusContext.Provider>
    </div>
  );
}

export default CardContextMenu;
