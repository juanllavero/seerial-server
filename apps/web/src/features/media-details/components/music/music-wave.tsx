import { useMusicStore } from '@seerial/stores';
import '@/styles/animations.css';
import { memo } from 'react';

const MusicWave = () => {
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const bars = [0, 1, 2, 3];
  const delays = [0.3, 0.8, 0.5, 0.1];

  return (
    <div className="flex h-6 items-end justify-center space-x-0.5">
      {bars.map((_, index) => (
        <div
          key={index}
          className={`min-h-[3px] w-[0.18rem] bg-[var(--app-color)] ${
            isPlaying ? 'animate-wave' : 'h-[20%]'
          }`}
          style={{
            animationDelay: `${delays[index]}s`, // Staggered delay for each bar
          }}
        />
      ))}
    </div>
  );
};

export default memo(MusicWave);
