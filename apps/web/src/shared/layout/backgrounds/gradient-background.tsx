import { api } from '@seerial/api';
import { useEffect, useRef, useState } from 'react';

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [gradientCSS, setGradientCSS] = useState<string | undefined>('');
  const canvasRef1 = useRef<HTMLCanvasElement | null>(null);
  const canvasRef2 = useRef<HTMLCanvasElement | null>(null);
  const canvasRefs = [canvasRef1, canvasRef2];

  useEffect(() => {
    if (!showGradient || !imageSrc || imageSrc === '') {
      setVisible(false);
      return;
    }

    const generateGradient = async () => {
      setVisible(true);

      const response = await api.get<{ data?: { css?: string }; css?: string }>(
        `/api/image-colors?${imageSrc?.startsWith('http') ? `url=${imageSrc}` : `localPath=${imageSrc}`}`,
      );

      const css = response?.data?.css ?? response?.css;

      const newIndex = (activeIndex + 1) % 2;
      setGradientCSS(css);

      const timeout = setTimeout(() => {
        setActiveIndex(newIndex);
      }, 100);

      return () => clearTimeout(timeout);
    };

    generateGradient();
  }, [activeIndex, imageSrc, showGradient]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: index, width, height }}>
      {[0, 1].map((i) => (
        <canvas
          key={i}
          ref={canvasRefs[i]}
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${activeIndex === i && showGradient && visible ? 'opacity-100' : 'opacity-0'} `}
          style={{
            width,
            height,
            background: gradientCSS ? gradientCSS.replace('background: ', '').replace(';', '') : '',
          }}
        />
      ))}
    </div>
  );
};

export default GradientBackground;
