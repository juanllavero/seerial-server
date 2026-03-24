import { useServerStore } from '@seerial/stores';
import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '@/lib/auth';

interface GradientBackgroundProps {
  showGradient?: boolean;
  imageSrc?: string;
  width?: string;
  height?: string;
  index?: number;
}

const GradientBackground = ({
  showGradient = true,
  imageSrc,
  width = '100%',
  height = '100%',
  index = -1,
}: GradientBackgroundProps) => {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const [currentGradient, setCurrentGradient] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const gradientRef = useRef<HTMLDivElement>(null);
  const handleTransitionEndRef = useRef<((event: TransitionEvent) => void) | null>(null);

  useEffect(() => {
    if (!showGradient || !imageSrc || imageSrc === '') {
      setCurrentGradient('');
      return;
    }

    let isMounted = true;

    const generateGradient = async () => {
      try {
        const response = await authenticatedFetch(
          `${serverUrl}/api/image-colors?${
            imageSrc?.startsWith('http') ? `url=${imageSrc}` : `localPath=${imageSrc}`
          }`,
        );
        const data = await response.json();
        if (!data || (!data.css && !data.data?.css)) {
          console.error('Invalid response for gradient generation:', data);
          return;
        }

        const cleanCss = data.css.replace('background: ', '').replace(';', '');

        if (!isMounted) return;

        if (!currentGradient) {
          setCurrentGradient(cleanCss);
          return;
        }

        setIsTransitioning(true);

        handleTransitionEndRef.current = (event: TransitionEvent) => {
          if (event.propertyName !== 'opacity' || !isMounted) return;

          setCurrentGradient(cleanCss);
          setTimeout(() => {
            setIsTransitioning(false);
          }, 0);

          if (gradientRef.current && handleTransitionEndRef.current) {
            gradientRef.current.removeEventListener(
              'transitionend',
              handleTransitionEndRef.current,
            );
          }
          handleTransitionEndRef.current = null;
        };

        if (gradientRef.current && handleTransitionEndRef.current) {
          gradientRef.current.addEventListener('transitionend', handleTransitionEndRef.current);
        }
      } catch (error) {
        console.error('Error generating gradient:', error);
      }
    };

    generateGradient();

    return () => {
      isMounted = false;
      if (gradientRef.current && handleTransitionEndRef.current) {
        gradientRef.current.removeEventListener('transitionend', handleTransitionEndRef.current);
        handleTransitionEndRef.current = null;
      }
    };
  }, [imageSrc, serverUrl, showGradient, currentGradient]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: index, width, height }}>
      <div
        ref={gradientRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          width,
          height,
          background: currentGradient,
        }}
      />
    </div>
  );
};

export default GradientBackground;
