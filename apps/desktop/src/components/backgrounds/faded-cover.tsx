import Image from '../ui/Image';

interface FadedCoverProps {
  imageSrc?: string;
  className?: string;
}

const FadedCover = ({ imageSrc, className = '' }: FadedCoverProps) => {
  if (!imageSrc) return null;

  const mask = 'radial-gradient(farthest-side at 40% 40%, black 30%, transparent 90%)';

  return (
    <div className="absolute z-0 left-0 top-0 h-full w-[55%]">
      <div
        className={`relative h-full ${className}`}
        style={{
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      >
        <Image url={imageSrc} alt="Cover Art" className="h-full w-full object-cover" />
      </div>
    </div>
  );
};

export default FadedCover;
