import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { ChevronRight } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useSettingsOptions } from '../settings-options-context';

interface SelectOption {
  label: string;
  value: string;
}

interface SettingSelectProps {
  focusKey: string;
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

function SettingSelect({
  focusKey,
  label,
  description,
  value,
  options,
  onChange,
}: SettingSelectProps) {
  const currentIndex = options.findIndex((o) => o.value === value);
  const { openOptions } = useSettingsOptions();

  const requestOpen = useCallback(() => {
    openOptions({ options, value, label, onChange, returnFocusKey: focusKey });
  }, [openOptions, options, value, label, onChange, focusKey]);

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: requestOpen,
    onArrowPress: (direction) => {
      if (direction === 'right') {
        requestOpen();
        return false;
      }
      return true;
    },
  });

  const currentLabel = currentIndex >= 0 ? options[currentIndex].label : value;

  return (
    <div
      ref={ref}
      className={`mb-2 flex w-full cursor-pointer items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${
        focused ? 'border-white/30 bg-white/15' : 'border-white/5 bg-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-white">{label}</span>
        {description && <span className="text-xs text-white/40">{description}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/70">{currentLabel}</span>
        <ChevronRight
          size={14}
          className={`transition-opacity ${focused ? 'text-white/60' : 'text-white/0'}`}
        />
      </div>
    </div>
  );
}

export default memo(SettingSelect);
