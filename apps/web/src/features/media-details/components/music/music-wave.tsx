import { useMusicStore } from '@seerial/stores';
import '@/styles/animations.css';

const MusicWave = () => {
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const bars = ['bar-0', 'bar-1', 'bar-2', 'bar-3'];
  const delays = [0.3, 0.8, 0.5, 0.1];

  return (
    <div className="flex h-6 items-end justify-center gap-x-0.5">
      {bars.map((barId, index) => (
        <div
          key={barId}
          className={`min-h-0.75 w-[0.18rem] bg-(--app-color) ${
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

export default MusicWave;
