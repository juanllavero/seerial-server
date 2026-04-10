import { memo } from 'react';
import BackgroundImage from '@/components/backgrounds/BackgroundImage';
import GradientBackground from '@/components/backgrounds/GradientBackground';

interface DetailsBackgroundLayersProps {
  imageSrc?: string;
  isHidden: boolean;
}

function DetailsBackgroundLayers({ imageSrc, isHidden }: DetailsBackgroundLayersProps) {
  const opacityClass = isHidden ? 'opacity-0' : 'opacity-100';

  return (
    <>
      <div className={`absolute inset-0 transition-opacity duration-700 ${opacityClass}`}>
        <GradientBackground imageSrc={imageSrc} index={0} />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-700 ${opacityClass}`}>
        <BackgroundImage imageSrc={imageSrc} />
      </div>
    </>
  );
}

export default memo(DetailsBackgroundLayers);
