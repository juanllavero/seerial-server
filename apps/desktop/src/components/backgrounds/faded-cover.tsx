import Image from '../ui/Image';

interface FadedCoverProps {
  imageSrc?: string;
  className?: string;
}

const FadedCover = ({ imageSrc, className = '' }: FadedCoverProps) => {
  if (!imageSrc) return null;

  const mask = 'radial-gradient(circle at -30% 50%, black 50%, transparent 90%)';

  return (
    <div
      className={`relative h-full ${className}`}
      style={{
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    >
      <Image url={imageSrc} alt="Cover Art" className="h-full w-full object-cover" />
    </div>
  );
};

export default FadedCover;
