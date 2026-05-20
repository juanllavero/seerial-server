import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, type VideoQuality } from '@/shared/stores';
import SettingCheckbox from '../controls/setting-checkbox';
import SettingSelect from '../controls/setting-select';

const VIDEO_QUALITY_VALUES: VideoQuality[] = ['low', 'normal', 'high', 'ultra', 'maximum'];
const VIDEO_QUALITY_KEYS: Record<VideoQuality, string> = {
  low: 'qualityLow',
  normal: 'qualityNormal',
  high: 'qualityHigh',
  ultra: 'qualityUltra',
  maximum: 'qualityMaximum',
};

function VideoSettings() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const videoQualityOptions = VIDEO_QUALITY_VALUES.map((v) => ({
    label: t(VIDEO_QUALITY_KEYS[v]),
    value: v,
  }));

  return (
    <div className="flex flex-col gap-1">
      <SettingCheckbox
        focusKey="settings-video-hardwareDecoding"
        label={t('hardwareDecoding')}
        checked={settings.hardwareDecoding}
        onChange={(v) => updateSetting('hardwareDecoding', v)}
      />
      <SettingSelect
        focusKey="settings-video-videoQuality"
        label={t('videoPlaybackQuality')}
        value={settings.videoQuality}
        options={videoQualityOptions}
        onChange={(v) => updateSetting('videoQuality', v as VideoQuality)}
      />
    </div>
  );
}

export default memo(VideoSettings);
