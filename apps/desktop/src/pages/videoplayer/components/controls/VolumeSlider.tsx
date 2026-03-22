import { invoke } from '@tauri-apps/api/core';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { ref } from 'process';
import { useEffect, useRef, useState } from 'react';
import NavigationButton from '@/components/navigation/NavigationButton';
import FlexBox from '@/components/ui/FlexBox';

function VolumeSlider() {
  const prevVolume = useRef<number>(100);
  const [volume, setVolume] = useState(100);
  const sliderRef = useRef<HTMLInputElement>(null);

  const handleVolumeChange = async (vol: number) => {
    if (vol === 0 && volume > 0) {
      prevVolume.current = volume;
    }
    setVolume(vol);
    await invoke('set_volume', { volume: vol }).catch(console.error);
  };

  const handleMuteToggle = async () => {
    if (volume === 0) {
      const restoredVolume = prevVolume.current || 100;
      setVolume(restoredVolume);
      await invoke('set_volume', { volume: restoredVolume }).catch(console.error);
    } else {
      prevVolume.current = volume;
      setVolume(0);
      await invoke('set_volume', { volume: 0 }).catch(console.error);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={25} />;
    else if (volume <= 25) return <Volume1 size={25} />;
    else return <Volume2 size={25} />;
  };

  // Update slider color on volume change
  useEffect(() => {
    if (sliderRef.current) {
      const min = Number(sliderRef.current.min);
      const max = Number(sliderRef.current.max);
      const value = Number(sliderRef.current.value);

      const percentage = ((value - min) / (max - min)) * 100;

      sliderRef.current.style.setProperty('--value-percent', `${percentage}%`);
    }
  }, [volume]);

  return (
    <FlexBox align="center" gap={0.5}>
      <NavigationButton className="p-2" transparent onClick={handleMuteToggle}>
        {getVolumeIcon()}
      </NavigationButton>
      <input
        ref={sliderRef}
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
        className={`
        w-18 h-1.5 rounded-lg appearance-none cursor-pointer
        bg-gray-600
        bg-[linear-gradient(to_right,theme(colors.white)_0%,theme(colors.white)_var(--value-percent),theme(colors.gray.600)_var(--value-percent),theme(colors.gray.600)_100%)]

        [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:w-4
        [&::-webkit-slider-thumb]:h-4
        [&::-webkit-slider-thumb]:bg-white
        [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:shadow-md
        [&::-webkit-slider-thumb]:hover:bg-gray-300
        [&::-moz-range-progress]:bg-white 
        [&::-moz-range-track]:bg-gray-600
        [&::-moz-range-thumb]:appearance-none
        [&::-moz-range-thumb]:w-4
        [&::-moz-range-thumb]:h-4
        [&::-moz-range-thumb]:bg-white
        [&::-moz-range-thumb]:border-none
        [&::-moz-range-thumb]:rounded-full
        [&::-moz-range-thumb]:hover:bg-gray-300
      `}
      />
    </FlexBox>
  );
}

export default VolumeSlider;
