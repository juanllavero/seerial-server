import { createWithEqualityFn } from 'zustand/traditional';

export type ThemeMusicVolume = 'off' | 'low' | 'medium' | 'high' | 'veryHigh';
export type ScreensaverTimeout = 'off' | '1m' | '5m' | '10m' | '30m' | '1h';
export type VideoQuality = 'low' | 'normal' | 'high' | 'ultra' | 'maximum';
export type CardRoundness =
  | 'rounded-none'
  | 'rounded-sm'
  | 'rounded-md'
  | 'rounded-lg'
  | 'rounded-xl'
  | 'rounded-2xl'
  | 'rounded-3xl';

export interface AppSettings {
  // General
  language: string;
  watchedIndicator: boolean;
  feedbackSounds: boolean;
  themeMusicVolume: ThemeMusicVolume;
  screensaver: ScreensaverTimeout;
  reduceAnimations: boolean;
  showEndTime: boolean;
  autoplayNext: boolean;
  autoplayCountdown: number;
  cardsPerRow: number;
  cardRoundness: CardRoundness;

  // Audio
  normalizeMultichannel: boolean;
  exclusiveAudio: boolean;

  // Video
  hardwareDecoding: boolean;
  videoQuality: VideoQuality;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  watchedIndicator: true,
  feedbackSounds: true,
  themeMusicVolume: 'medium',
  screensaver: 'off',
  reduceAnimations: false,
  showEndTime: true,
  autoplayNext: true,
  autoplayCountdown: 5,
  cardsPerRow: 8,
  cardRoundness: 'rounded-lg',

  normalizeMultichannel: false,
  exclusiveAudio: false,

  hardwareDecoding: false,
  videoQuality: 'normal',
};

const STORAGE_KEY = 'app-settings';

function loadFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // Corrupted data — fall back to defaults
  }
  return DEFAULT_SETTINGS;
}

function persistToStorage(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface SettingsState {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export const useSettingsStore = createWithEqualityFn<SettingsState>((set) => ({
  settings: loadFromStorage(),

  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    set((state) => {
      const next = { ...state.settings, [key]: value };
      persistToStorage(next);
      return { settings: next };
    });
  },
}));
