import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { Check } from 'lucide-react';
import { memo } from 'react';

interface SettingCheckboxProps {
  focusKey: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function SettingCheckbox({
  focusKey,
  label,
  description,
  checked,
  onChange,
}: SettingCheckboxProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => onChange(!checked),
  });

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onChange(!checked)}
      className={`mb-2 flex w-full cursor-pointer items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${
        focused ? 'border-white/30 bg-white/15' : 'border-white/5 bg-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-white">{label}</span>
        {description && <span className="text-xs text-white/40">{description}</span>}
      </div>
      <div
        className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
          checked ? 'border-white bg-white' : 'border-white/30 bg-transparent'
        }`}
      >
        {checked && <Check size={14} className="text-black" />}
      </div>
    </button>
  );
}

export default memo(SettingCheckbox);
