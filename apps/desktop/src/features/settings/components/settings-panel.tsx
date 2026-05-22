import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { NavigationContainer } from '@/shared/components/navigation';
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import SettingsCategoryContent from './settings-category-content';
import SettingsCategoryList from './settings-category-list';
import type { OptionsRequest } from './settings-options-context';
import { SettingsOptionsContext } from './settings-options-context';
import SettingsOptionsPanel from './settings-options-panel';

export type SettingsCategory = 'general' | 'audio' | 'video' | 'about';

const CATEGORIES: SettingsCategory[] = ['general', 'audio', 'video', 'about'];

const FIRST_CATEGORY_KEY = `settings-category-${CATEGORIES[0]}`;

const SLIDE_TRANSITION = { duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

interface OpenSettingsPanelProps {
  onClose: () => void;
}

function OpenSettingsPanel({ onClose }: OpenSettingsPanelProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const [optionsData, setOptionsData] = useState<OptionsRequest | null>(null);

  const closeOptions = useCallback(() => {
    const returnKey = optionsData?.returnFocusKey;
    setOptionsData(null);
    if (returnKey) {
      window.requestAnimationFrame(() => setFocus(returnKey));
    }
  }, [optionsData?.returnFocusKey]);

  useKeyboardShortcut({
    key: ['Escape', 'Backspace'],
    enabled: true,
    capture: true,
    onKeyDown: useCallback(
      (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (optionsData) {
          closeOptions();
        } else {
          onClose();
        }
      },
      [onClose, optionsData, closeOptions],
    ),
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFocus(FIRST_CATEGORY_KEY);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleCategorySelect = useCallback((category: SettingsCategory) => {
    setActiveCategory(category);
    setOptionsData(null);
  }, []);

  const optionsCtx = useMemo(() => ({ openOptions: setOptionsData }), []);

  return (
    <>
      {/* Backdrop */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed inset-0 z-50 bg-black/70"
      />

      {/* Panel — slides in from the right, widens when options open */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={SLIDE_TRANSITION}
        className="absolute inset-y-0 top-20 right-20 z-50 flex"
      >
        <div className="flex h-[80dvh] w-dvh">
          <NavigationContainer
            isFocusBoundary
            customFocusKey={NavigationFocusKeys.settings.container}
            className="flex h-full w-full overflow-hidden border border-white/10 bg-neutral-950 shadow-2xl rounded-2xl"
          >
            <SettingsOptionsContext.Provider value={optionsCtx}>
              {/* Categories sidebar */}
              <NavigationContainer
                customFocusKey="settings-sidebar"
                isFocusBoundary
                focusBoundaryDirections={['left', 'up', 'down']}
                className="flex w-66 shrink-0 flex-col border-r border-white/10"
              >
                <div className="px-6 pt-8 pb-8">
                  <h1 className="text-4xl font-semibold text-white">{t('settings')}</h1>
                </div>
                <SettingsCategoryList
                  categories={CATEGORIES}
                  activeCategory={activeCategory}
                  onCategorySelect={handleCategorySelect}
                />
              </NavigationContainer>

              {/* Content area */}
              <NavigationContainer
                customFocusKey="settings-content"
                isFocusBoundary
                focusBoundaryDirections={['up', 'down']}
                className="flex-1 overflow-y-auto p-8"
              >
                <SettingsCategoryContent category={activeCategory} />
              </NavigationContainer>

              {/* Options panel (third pane) */}
              <SettingsOptionsPanel data={optionsData} onClose={closeOptions} />
            </SettingsOptionsContext.Provider>
          </NavigationContainer>
        </div>
      </m.div>
    </>
  );
}

function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  return createPortal(
    <LazyMotion features={domAnimation}>
      <AnimatePresence>{open && <OpenSettingsPanel onClose={onClose} />}</AnimatePresence>
    </LazyMotion>,
    document.body,
  );
}

export default memo(SettingsPanel);
