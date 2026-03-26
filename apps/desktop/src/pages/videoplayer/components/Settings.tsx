import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { SettingsIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import NavigationButton from '@/components/navigation/NavigationButton';
import NavigationContainer from '@/components/navigation/NavigationContainer';
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import type { PlayerSettings, SubtitlePosition, SubtitleSize } from '../hooks/use-player-settings';

const ZOOM_MIN = -3;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.5;

const DELAY_STEP = 50; // ms

const SUBTITLE_SIZES: SubtitleSize[] = ['tiny', 'small', 'normal', 'big', 'large'];
const SUBTITLE_POSITIONS: SubtitlePosition[] = ['bottom', 'top'];

const BORDER_SIZES = [0, 1, 2, 3, 4, 5];
const SHADOW_OFFSETS = [0, 1, 2, 3, 4, 5];

const SUBTITLE_COLORS = [
  { key: 'white', hex: '#FFFFFF' },
  { key: 'yellow', hex: '#FFFF00' },
  { key: 'green', hex: '#00FF00' },
  { key: 'cyan', hex: '#00FFFF' },
  { key: 'blue', hex: '#0000FF' },
  { key: 'magenta', hex: '#FF00FF' },
  { key: 'red', hex: '#FF0000' },
  { key: 'orange', hex: '#FFA500' },
  { key: 'pink', hex: '#FF69B4' },
  { key: 'teal', hex: '#008080' },
  { key: 'black', hex: '#000000' },
] as const;

function settingFocusKey(id: string) {
  return `player-setting-${id}`;
}

// Cycle through an array of values
function cycleValue<T>(values: T[], current: T, direction: 'left' | 'right'): T {
  const idx = values.indexOf(current);
  if (idx === -1) return values[0];
  const next =
    direction === 'right' ? (idx + 1) % values.length : (idx - 1 + values.length) % values.length;
  return values[next];
}

// Step a numeric value within a range
function stepValue(
  current: number,
  step: number,
  min: number,
  max: number,
  direction: 'left' | 'right',
): number {
  const delta = direction === 'right' ? step : -step;
  return Math.round(Math.max(min, Math.min(max, current + delta)) * 100) / 100;
}

interface SettingRowProps {
  focusKey: string;
  label: string;
  value: string;
  colorSwatch?: string;
  disabled?: boolean;
  onArrowPress: (direction: string) => boolean | undefined;
}

function SettingRow({
  focusKey,
  label,
  value,
  colorSwatch,
  disabled,
  onArrowPress,
}: SettingRowProps) {
  return (
    <NavigationButton
      customKey={focusKey}
      disabled={disabled}
      className="mb-1 h-auto w-full justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left text-sm text-white transition-colors hover:text-black disabled:opacity-40"
      onArrowPress={onArrowPress}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {colorSwatch && (
            <div
              className="size-4 rounded-full border border-white/30"
              style={{ backgroundColor: colorSwatch }}
            />
          )}
          <span className="text-white/60">{value}</span>
        </div>
      </div>
    </NavigationButton>
  );
}

interface SettingsProps {
  onPanelChange?: (open: boolean) => void;
  settings: PlayerSettings;
  updateSetting: <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => void;
}

function Settings({ onPanelChange, settings, updateSetting }: SettingsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const closePanel = useCallback(() => {
    setOpen(false);
    setTimeout(() => setFocus(NavigationFocusKeys.player.settingsButton), 30);
  }, []);

  useEffect(() => {
    onPanelChange?.(open);
  }, [open, onPanelChange]);

  useEffect(() => {
    if (open) {
      const focusTimeout = window.setTimeout(() => {
        setFocus(settingFocusKey('quality'));
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

  const handleArrow = useCallback(
    (_key: keyof PlayerSettings, handler: (dir: 'left' | 'right') => void) =>
      (direction: string) => {
        if (direction === 'left' || direction === 'right') {
          handler(direction);
          return false;
        }
        return true;
      },
    [],
  );

  const currentColor =
    SUBTITLE_COLORS.find((c) => c.hex === settings.subtitleColor) ?? SUBTITLE_COLORS[0];

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
              className="absolute bottom-full right-0 z-50 mb-4 w-104"
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/85 shadow-2xl backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/45">
                    {t('player')}
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-white">{t('settings')}</div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-3">
                  {/* Video Section */}
                  <div className="mb-1 px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                    {t('video')}
                  </div>
                  <SettingRow
                    focusKey={settingFocusKey('quality')}
                    label={t('quality')}
                    value={t('original')}
                    disabled
                    onArrowPress={() => true}
                  />
                  <SettingRow
                    focusKey={settingFocusKey('zoom')}
                    label={t('zoom')}
                    value={`${settings.zoom.toFixed(1)}x`}
                    onArrowPress={handleArrow('zoom', (dir) =>
                      updateSetting(
                        'zoom',
                        stepValue(settings.zoom, ZOOM_STEP, ZOOM_MIN, ZOOM_MAX, dir),
                      ),
                    )}
                  />

                  {/* Audio Section */}
                  <div className="mb-1 mt-2 px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                    {t('audio')}
                  </div>
                  <SettingRow
                    focusKey={settingFocusKey('audio-delay')}
                    label={t('delay')}
                    value={`${settings.audioDelay} ms`}
                    onArrowPress={handleArrow('audioDelay', (dir) =>
                      updateSetting(
                        'audioDelay',
                        settings.audioDelay + (dir === 'right' ? DELAY_STEP : -DELAY_STEP),
                      ),
                    )}
                  />

                  {/* Subtitles Section */}
                  <div className="mb-1 mt-2 px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                    {t('subs')}
                  </div>
                  <SettingRow
                    focusKey={settingFocusKey('sub-delay')}
                    label={t('delay')}
                    value={`${settings.subtitleDelay} ms`}
                    onArrowPress={handleArrow('subtitleDelay', (dir) =>
                      updateSetting(
                        'subtitleDelay',
                        settings.subtitleDelay + (dir === 'right' ? DELAY_STEP : -DELAY_STEP),
                      ),
                    )}
                  />
                  <SettingRow
                    focusKey={settingFocusKey('sub-size')}
                    label={t('size')}
                    value={t(settings.subtitleSize)}
                    onArrowPress={handleArrow('subtitleSize', (dir) =>
                      updateSetting(
                        'subtitleSize',
                        cycleValue(SUBTITLE_SIZES, settings.subtitleSize, dir),
                      ),
                    )}
                  />
                  <SettingRow
                    focusKey={settingFocusKey('sub-color')}
                    label={t('color')}
                    value={t(currentColor.key)}
                    colorSwatch={currentColor.hex}
                    onArrowPress={handleArrow('subtitleColor', (dir) => {
                      const nextColor = cycleValue([...SUBTITLE_COLORS], currentColor, dir);
                      updateSetting('subtitleColor', nextColor.hex);
                    })}
                  />
                  <SettingRow
                    focusKey={settingFocusKey('sub-border')}
                    label={t('border')}
                    value={`${settings.subtitleBorderSize}`}
                    onArrowPress={handleArrow('subtitleBorderSize', (dir) =>
                      updateSetting(
                        'subtitleBorderSize',
                        cycleValue(BORDER_SIZES, settings.subtitleBorderSize, dir),
                      ),
                    )}
                  />
                  <SettingRow
                    focusKey={settingFocusKey('sub-shadow')}
                    label={t('shadow')}
                    value={`${settings.subtitleShadowOffset}`}
                    onArrowPress={handleArrow('subtitleShadowOffset', (dir) =>
                      updateSetting(
                        'subtitleShadowOffset',
                        cycleValue(SHADOW_OFFSETS, settings.subtitleShadowOffset, dir),
                      ),
                    )}
                  />
                  <SettingRow
                    focusKey={settingFocusKey('sub-position')}
                    label={t('position')}
                    value={t(settings.subtitlePosition)}
                    onArrowPress={handleArrow('subtitlePosition', (dir) =>
                      updateSetting(
                        'subtitlePosition',
                        cycleValue(SUBTITLE_POSITIONS, settings.subtitlePosition, dir),
                      ),
                    )}
                  />
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
