import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef } from 'react';
import FlexBox from '@/shared/components/ui/flex-box';

interface VolumeIndicatorProps {
  volume: number;
  visible: boolean;
}

function VolumeIndicator({ volume, visible }: VolumeIndicatorProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--value-percent', `${volume}%`);
    }
  }, [volume]);

  const icon =
    volume === 0 ? (
      <VolumeX size={28} />
    ) : volume <= 25 ? (
      <Volume1 size={28} />
    ) : (
      <Volume2 size={28} />
    );

  return (
    <div
      className={`fixed top-12 left-1/2 z-50 -translate-x-1/2 transition-opacity duration-300 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <FlexBox
        align="center"
        gap={0.75}
        padding="0.75rem 1.25rem"
        className="rounded-2xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-md"
      >
        <span className="text-white">{icon}</span>
        <div
          ref={barRef}
          className="h-1.5 w-28 rounded-full bg-gray-600 bg-[linear-gradient(to_right,var(--color-white)_0%,var(--color-white)_var(--value-percent),var(--color-gray-600)_var(--value-percent),var(--color-gray-600)_100%)]"
        />
      </FlexBox>
    </div>
  );
}

export default VolumeIndicator;
