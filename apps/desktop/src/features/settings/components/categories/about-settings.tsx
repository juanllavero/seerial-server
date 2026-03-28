import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

function getOSName(): string {
  const { platform } = navigator;
  if (platform.startsWith('Win')) return 'Windows';
  if (platform.startsWith('Mac')) return 'macOS';
  if (platform.startsWith('Linux')) return 'Linux';
  return platform;
}

// biome-ignore lint/correctness/noUndeclaredVariables: <This is a special case where we inject the app version at build time>
const APP_VERSION = __APP_VERSION__;

function InfoCard({ focusKey, label, value }: { focusKey: string; label: string; value: string }) {
  const { ref, focused } = useFocusable({ focusKey });

  return (
    <div
      ref={ref}
      className={`rounded-xl border px-5 py-4 transition-colors ${
        focused ? 'border-white/30 bg-white/15' : 'border-white/5 bg-white/5'
      }`}
    >
      <span className="text-xs text-white/40">{label}</span>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function AboutSettings() {
  const { t } = useTranslation();

  const osName = getOSName();
  const isDev = import.meta.env.DEV;
  const displayVersion = isDev ? `${APP_VERSION}-dev` : APP_VERSION;

  return (
    <div className="flex flex-col gap-4">
      <InfoCard
        focusKey="settings-about-appName"
        label={t('appName')}
        value={`Seerial HTPC (${osName})`}
      />
      <InfoCard
        focusKey="settings-about-version"
        label={t('clientVersion')}
        value={displayVersion}
      />
    </div>
  );
}

export default memo(AboutSettings);
