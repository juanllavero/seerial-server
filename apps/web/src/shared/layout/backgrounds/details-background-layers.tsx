import { useGradientStore } from '@seerial/stores';
import { memo, useEffect } from 'react';

interface DetailsBackgroundLayersProps {
  imageSrc?: string;
  isHidden?: boolean;
}

function DetailsBackgroundLayers({ imageSrc, isHidden = false }: DetailsBackgroundLayersProps) {
  const setGradientImageSrc = useGradientStore((state) => state.setGradientImageSrc);
  const opacityClass = isHidden ? 'opacity-0' : 'opacity-100';

  useEffect(() => {
    setGradientImageSrc(imageSrc ?? '');
    return () => setGradientImageSrc('');
  }, [imageSrc, setGradientImageSrc]);

  return (
    <div className={`absolute z-[-1] inset-0 transition-opacity duration-700 ${opacityClass}`}>
      {/* <BackgroundImage imageSrc={imageSrc} /> */}
    </div>
  );
}

export default memo(DetailsBackgroundLayers);
