import type React from 'react';
import { memo } from 'react';
import Image from '../ui/image';

const AlignedImage = ({ imageUrl, className }: { imageUrl: string; className?: string }) => {
  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '80dvh',
    height: '20dvh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  };

  const imageStyle: React.CSSProperties = {
    height: '20dvh',
    width: 'auto',
    maxWidth: '100%',
    objectFit: 'contain',
  };

  return (
    <div className={className} style={containerStyle}>
      <Image src={imageUrl} width="100%" height="20dvh" style={imageStyle} alt="" />
    </div>
  );
};

export default memo(AlignedImage);
