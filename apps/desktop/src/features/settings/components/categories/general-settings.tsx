import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import langs from '@/localization/langs';
import {
  type ScreensaverTimeout,
  type ThemeMusicVolume,
  useSettingsStore,
} from '../../stores/settings.store';
import SettingCheckbox from '../controls/setting-checkbox';
import SettingSelect from '../controls/setting-select';
import SettingSlider from '../controls/setting-slider';

const THEME_MUSIC_VALUES: ThemeMusicVolume[] = ['off', 'low', 'medium', 'high', 'veryHigh'];
const THEME_MUSIC_KEYS: Record<ThemeMusicVolume, string> = {
  off: 'volumeOff',
  low: 'volumeLow',
  medium: 'volumeMedium',
  high: 'volumeHigh',
  veryHigh: 'volumeVeryHigh',
};

const SCREENSAVER_VALUES: ScreensaverTimeout[] = ['off', '1m', '5m', '10m', '30m', '1h'];
const SCREENSAVER_KEYS: Record<ScreensaverTimeout, string> = {
  off: 'screensaverNone',
  '1m': 'screensaver1m',
  '5m': 'screensaver5m',
  '10m': 'screensaver10m',
  '30m': 'screensaver30m',
  '1h': 'screensaver1h',
};

function GeneralSettings() {
  const { t, i18n } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const languageOptions = langs.map((l) => ({
    label: `${l.prefix} ${l.nativeName}`,
    value: l.key,
  }));

  const themeMusicOptions = THEME_MUSIC_VALUES.map((v) => ({
    label: t(THEME_MUSIC_KEYS[v]),
    value: v,
  }));

  const screensaverOptions = SCREENSAVER_VALUES.map((v) => ({
    label: t(SCREENSAVER_KEYS[v]),
    value: v,
  }));

  const handleLanguageChange = useCallback(
    (value: string) => {
      updateSetting('language', value);
      i18n.changeLanguage(value);
    },
    [updateSetting, i18n],
  );

  return (
    <div className="flex flex-col gap-1">
      <SettingSelect
        focusKey="settings-general-language"
        label={t('language')}
        value={settings.language}
        options={languageOptions}
        onChange={handleLanguageChange}
      />
      <SettingCheckbox
        focusKey="settings-general-watchedIndicator"
        label={t('watchedIndicator')}
        checked={settings.watchedIndicator}
        onChange={(v) => updateSetting('watchedIndicator', v)}
      />
      <SettingCheckbox
        focusKey="settings-general-feedbackSounds"
        label={t('feedbackSounds')}
        checked={settings.feedbackSounds}
        onChange={(v) => updateSetting('feedbackSounds', v)}
      />
      <SettingSelect
        focusKey="settings-general-themeMusicVolume"
        label={t('themeMusicVolume')}
        value={settings.themeMusicVolume}
        options={themeMusicOptions}
        onChange={(v) => updateSetting('themeMusicVolume', v as ThemeMusicVolume)}
      />
      <SettingSelect
        focusKey="settings-general-screensaver"
        label={t('screensaver')}
        value={settings.screensaver}
        options={screensaverOptions}
        onChange={(v) => updateSetting('screensaver', v as ScreensaverTimeout)}
      />
      <SettingCheckbox
        focusKey="settings-general-reduceAnimations"
        label={t('reduceAnimations')}
        checked={settings.reduceAnimations}
        onChange={(v) => updateSetting('reduceAnimations', v)}
      />
      <SettingCheckbox
        focusKey="settings-general-showEndTime"
        label={t('showEndTime')}
        checked={settings.showEndTime}
        onChange={(v) => updateSetting('showEndTime', v)}
      />
      <SettingCheckbox
        focusKey="settings-general-autoplayNext"
        label={t('autoplayNext')}
        checked={settings.autoplayNext}
        onChange={(v) => updateSetting('autoplayNext', v)}
      />
      <SettingSlider
        focusKey="settings-general-autoplayCountdown"
        label={t('autoplayCountdown')}
        value={settings.autoplayCountdown}
        min={0}
        max={15}
        displayValue={t('autoplayCountdownUnit', { value: settings.autoplayCountdown })}
        onChange={(v) => updateSetting('autoplayCountdown', v)}
      />
      <SettingSlider
        focusKey="settings-general-cardsPerRow"
        label={t('cardsPerRow')}
        value={settings.cardsPerRow}
        min={4}
        max={20}
        onChange={(v) => updateSetting('cardsPerRow', v)}
      />
    </div>
  );
}

export default memo(GeneralSettings);
