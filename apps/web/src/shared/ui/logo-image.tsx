import type React from 'react';
import { memo } from 'react';
import LazyImage from '../ui/lazy-image';

const LogoImage = ({ imageUrl, className }: { imageUrl: string; className?: string }) => {
  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '80dvh',
    height: '18dvh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  };

  const imageStyle: React.CSSProperties = {
    height: '18dvh',
    width: 'auto',
    maxWidth: '100%',
    objectFit: 'contain',
  };

  return (
    <div className={className} style={containerStyle}>
      <LazyImage url={imageUrl} width="100%" height="20dvh" style={imageStyle} alt="" />
    </div>
  );
};

export default memo(LogoImage);
