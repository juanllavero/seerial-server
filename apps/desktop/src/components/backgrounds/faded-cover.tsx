
import Image from '../ui/Image';

interface FadedCoverProps {
  imageSrc?: string;
  videoBlobUrl?: string | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  className?: string;
}

const FadedCover = ({ imageSrc, videoBlobUrl, videoRef, className = '' }: FadedCoverProps) => {
  if (!imageSrc && !videoBlobUrl) return null;

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
        {videoBlobUrl ? (
          <video
            ref={videoRef}
            src={videoBlobUrl}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        ) : imageSrc ? (
          <Image url={imageSrc} alt="Cover Art" className="h-full w-full object-cover" />
        ) : null}
      </div>
    </div>
  );
};

export default FadedCover;

