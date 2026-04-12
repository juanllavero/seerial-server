import { useResolveImageUrl } from '@/hooks/use-resolve-image-url';
import '@/styles/animations.css';

interface BlurredBackgroundProps {
  url?: string;
}

const BlurredBackground = ({ url }: BlurredBackgroundProps) => {
  const { resolvedUrl, localImageError } = useResolveImageUrl(url, true);
  if (!resolvedUrl || localImageError) return null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-black z-0">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{
          backgroundImage: `url(${resolvedUrl})`,
          filter: 'blur(80px) saturate(150%)',
          transform: 'scale(1.5)',
          animation: 'slowSpin 60s linear infinite',
        }}
      />
    </div>
  );
};

export default BlurredBackground;
