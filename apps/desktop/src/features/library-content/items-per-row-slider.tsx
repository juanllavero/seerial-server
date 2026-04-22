import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { memo } from 'react';
import FlexBox from '@/shared/components/ui/flex-box';
import { Slider } from '@/shared/components/ui/slider';

interface ItemsPerRowSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  customFocusKey?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function ItemsPerRowSlider({
  value,
  min,
  max,
  onChange,
  customFocusKey = 'library-items-per-row-slider',
}: ItemsPerRowSliderProps) {
  const updateValue = (nextValue: number) => {
    onChange(clamp(nextValue, min, max));
  };

  const { ref, focused } = useFocusable({
    focusKey: customFocusKey,
    onArrowPress: (direction) => {
      if (direction === 'left') {
        updateValue(value - 1);

        return false;
      }

      if (direction === 'right') {
        updateValue(value + 1);

        return false;
      }

      return true;
    },
  });

  return (
    <div
      ref={ref}
      className={`w-full max-w-md rounded-2xl border px-5 py-4 backdrop-blur-sm transition-all duration-200 ${focused ? 'border-white/90 bg-black/45 shadow-lg shadow-black/25' : 'border-white/20 bg-black/25'}`}
    >
      <FlexBox direction="column" width="100%" gap={0.75}>
        <FlexBox width="100%" justify="space-between" align="center">
          <span className="text-sm font-medium text-white/80">Items per row</span>
          <span className="text-lg font-semibold text-white">{value}</span>
        </FlexBox>
        <Slider
          min={min}
          max={max}
          step={1}
          value={[value]}
          onValueChange={([nextValue]: number[]) => {
            if (typeof nextValue === 'number') {
              updateValue(nextValue);
            }
          }}
          aria-label="Items per row"
          className="py-1"
        />
        <span className="text-xs text-white/60">Use left and right to resize the grid.</span>
      </FlexBox>
    </div>
  );
}

export default memo(ItemsPerRowSlider);
