import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { SettingsIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import NavigationButton from '@/components/navigation/NavigationButton';
import NavigationContainer from '@/components/navigation/NavigationContainer';
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

const ZOOM_MIN = -3;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.5;

interface SettingsProps {
  onPanelChange?: (open: boolean) => void;
}

function Settings({ onPanelChange }: SettingsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(0);

  const closePanel = useCallback(() => {
    setOpen(false);
    setTimeout(() => setFocus(NavigationFocusKeys.player.settingsButton), 30);
  }, []);

  const handleZoomChange = useCallback((delta: number) => {
    setZoom((prev) => {
      const next = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev + delta)) * 10) / 10;
      invoke('set_zoom', { zoomLevel: next }).catch(console.error);
      return next;
    });
  }, []);

  useEffect(() => {
    onPanelChange?.(open);
  }, [open, onPanelChange]);

  useEffect(() => {
    if (open) {
      const focusTimeout = window.setTimeout(() => {
        setFocus(NavigationFocusKeys.player.settingsZoomSlider);
      }, 30);
      return () => window.clearTimeout(focusTimeout);
    }
  }, [open]);

  useKeyboardShortcut({
    key: ['Escape', 'Backspace'],
    enabled: open,
    onKeyDown: useCallback(
      (e: KeyboardEvent) => {
        e.preventDefault();
        closePanel();
      },
      [closePanel],
    ),
  });

  return (
    <div className="relative">
      <NavigationButton
        transparent
        customKey={NavigationFocusKeys.player.settingsButton}
        className={`p-2 ${open ? 'bg-white text-black' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <SettingsIcon />
      </NavigationButton>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed inset-0 z-40 bg-black/35"
              onClick={closePanel}
            />
            <NavigationContainer
              isFocusBoundary
              className="absolute bottom-full right-0 z-50 mb-4 w-[24rem]"
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/85 shadow-2xl backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/45">
                    {t('player')}
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-white">{t('settings')}</div>
                </div>
                <div className="p-3">
                  <NavigationButton
                    customKey={NavigationFocusKeys.player.settingsZoomSlider}
                    className="mb-2 h-auto w-full justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-base text-white transition-colors hover:text-black"
                    onArrowPress={(direction) => {
                      if (direction === 'left') {
                        handleZoomChange(-ZOOM_STEP);
                        return false;
                      }
                      if (direction === 'right') {
                        handleZoomChange(ZOOM_STEP);
                        return false;
                      }
                      return true;
                    }}
                  >
                    <div className="flex w-full items-center justify-between gap-4">
                      <div className="text-lg font-medium">Zoom</div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/15">
                          <div
                            className="h-full rounded-full bg-white transition-all duration-150"
                            style={{
                              width: `${((zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="min-w-12 text-right text-sm font-semibold text-white/60">
                          {zoom.toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </NavigationButton>
                </div>
              </motion.div>
            </NavigationContainer>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(Settings);
