import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Tertiary } from '@/shared/components/text';

interface SettingSliderProps {
  focusKey: string;
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue?: string;
  onChange: (value: number) => void;
}

function SettingSlider({
  focusKey,
  label,
  description,
  value,
  min,
  max,
  step = 1,
  displayValue,
  onChange,
}: SettingSliderProps) {
  const [editing, setEditing] = useState(false);

  const increment = useCallback(() => {
    const next = Math.min(value + step, max);
    if (next !== value) onChange(next);
  }, [value, step, max, onChange]);

  const decrement = useCallback(() => {
    const prev = Math.max(value - step, min);
    if (prev !== value) onChange(prev);
  }, [value, step, min, onChange]);

  const { ref, focused } = useFocusable({
    focusKey,
    onArrowPress: (direction) => {
      if (!editing) return true;
      if (direction === 'right') {
        increment();
        return false;
      }
      if (direction === 'left') {
        decrement();
        return false;
      }
      return true;
    },
    onEnterPress: () => setEditing((prev) => !prev),
  });

  // Exit edit mode when focus is lost
  if (!focused && editing) {
    setEditing(false);
  }

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={ref}
      className={`mb-2 flex cursor-pointer flex-col gap-3 rounded-xl border px-5 py-4 transition-colors ${
        editing
          ? 'border-white/50 bg-white/20'
          : focused
            ? 'border-white/30 bg-white/15'
            : 'border-white/5 bg-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <Tertiary className="font-medium text-white">{label}</Tertiary>
          {description && <div className="text-lg text-white/40">{description}</div>}
        </div>
        <Tertiary className="text-sm font-medium text-white/70">{displayValue ?? value}</Tertiary>
      </div>
      <div className="flex items-center gap-2">
        <ChevronLeft
          size={14}
          className={`shrink-0 transition-opacity ${editing ? 'text-white/60' : 'opacity-0'}`}
        />
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all ${
              editing ? 'bg-white' : focused ? 'bg-white/70' : 'bg-white/40'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <ChevronRight
          size={14}
          className={`shrink-0 transition-opacity ${editing ? 'text-white/60' : 'opacity-0'}`}
        />
      </div>
    </div>
  );
}

export default memo(SettingSlider);
