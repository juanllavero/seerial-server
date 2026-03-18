import type React from 'react';
import { useEffect } from 'react';

interface MusicGradientProps {
  imageUrl: string;
}

const animationKeyframes = `
  @keyframes spin-and-breathe {
    from {
      transform: translate(-50%, -50%) rotate(0deg) scale(1);
    }
    to {
      transform: translate(-50%, -50%) rotate(360deg) scale(1.05);
    }
  }
`;

const MusicGradient: React.FC<MusicGradientProps> = ({ imageUrl }) => {
  useEffect(() => {
    const styleTagId = 'apple-gradient-keyframes';
    if (document.getElementById(styleTagId)) return;

    const styleTag = document.createElement('style');
    styleTag.id = styleTagId;
    styleTag.innerHTML = animationKeyframes;
    document.head.appendChild(styleTag);

    // Clean on unmount
    return () => {
      const existingTag = document.getElementById(styleTagId);
      if (existingTag) {
        document.head.removeChild(existingTag);
      }
    };
  }, []);

  const url = `/api/${imageUrl.replace('resources/img', 'img')}`;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#111',
      }}
    >
      {/* Base Image */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundImage: `url(${url})`,
          backgroundSize: 'cover',
          filter: 'contrast(1.2)',
          transform: 'scale(1.2)',
        }}
      />

      {/* Small Images Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          filter: 'saturate(1.8)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            width: `60dvh`,
            height: `60dvh`,
            top: `${20}%`,
            left: `${10}%`,
            filter: `saturate(2) contrast(1.5)`,
            animation: `spin-and-breathe 40s linear infinite`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            width: `60dvh`,
            height: `60dvh`,
            top: `${25}%`,
            right: `${-20}%`,
            filter: `saturate(2) contrast(1.5)`,
            animation: `spin-and-breathe 40s linear infinite`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            width: `90dvh`,
            height: `90dvh`,
            top: '50%',
            left: '50%',
            alignSelf: 'center',
            justifySelf: 'center',
            filter: `saturate(2) contrast(1.5)`,
            animation: `spin-and-breathe 40s linear infinite`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            width: `60dvh`,
            height: `60dvh`,
            bottom: `${-20}%`,
            left: `${10}%`,
            filter: `saturate(2) contrast(1.5)`,
            animation: `spin-and-breathe 40s linear infinite`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            width: `60dvh`,
            height: `60dvh`,
            bottom: `${-20}%`,
            right: `${-20}%`,
            filter: `saturate(2) contrast(1.5)`,
            animation: `spin-and-breathe 40s linear infinite`,
          }}
        />
      </div>

      {/* Blur Layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          filter: 'brightness(0.7)',
          backdropFilter: 'blur(120px)',
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
        }}
      />
    </div>
  );
};

export default MusicGradient;
