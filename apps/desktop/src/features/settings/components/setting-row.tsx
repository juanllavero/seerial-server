import { memo } from 'react';
import NavigationButton from '@/components/navigation/NavigationButton';

interface SettingRowProps {
  focusKey: string;
  label: string;
  value: string;
  description?: string;
  onArrowPress?: (direction: string) => boolean | undefined;
  onClick?: () => void;
}

function SettingRow({
  focusKey,
  label,
  value,
  description,
  onArrowPress,
  onClick,
}: SettingRowProps) {
  return (
    <NavigationButton
      customKey={focusKey}
      className="mb-1 h-auto w-full justify-between rounded-xl border border-white/5 bg-white/5 px-5 py-4 text-left text-sm text-white transition-colors hover:text-black"
      onArrowPress={onArrowPress}
      onClick={onClick}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{label}</span>
          {description && <span className="text-xs text-white/40">{description}</span>}
        </div>
        <span className="shrink-0 text-white/60">{value}</span>
      </div>
    </NavigationButton>
  );
}

export default memo(SettingRow);
