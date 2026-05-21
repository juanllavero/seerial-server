import { pause, resume } from '@noriginmedia/norigin-spatial-navigation';
import { useEffect, useState } from 'react';
import '@/shared/styles/animations.css';

type LogoIntroStage = 'initial' | 'logo-appear' | 'logo-move' | 'text-appear' | 'fade-out';

function getAnimationStage(elapsedMs: number): LogoIntroStage {
  if (elapsedMs >= 4000) return 'fade-out';
  if (elapsedMs >= 1400) return 'text-appear';
  if (elapsedMs >= 1200) return 'logo-move';
  if (elapsedMs >= 100) return 'logo-appear';
  return 'initial';
}

const LogoIntro = () => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(
    () => sessionStorage.getItem('seerial_intro_played') === 'true',
  );

  useEffect(() => {
    if (hasPlayed) return;

    // Disable spatial navigation while intro is active
    pause();

    const start = Date.now();
    const intervalId = window.setInterval(() => {
      const newElapsed = Date.now() - start;
      setElapsedMs(newElapsed);

      if (newElapsed >= 5000) {
        sessionStorage.setItem('seerial_intro_played', 'true');
        setHasPlayed(true);
      }
    }, 50);

    return () => {
      window.clearInterval(intervalId);
      // Re-enable spatial navigation when intro unmounts
      resume();
    };
  }, [hasPlayed]);

  if (hasPlayed) return null;

  const animationStage = getAnimationStage(elapsedMs);

  return (
    <div className="fixed z-999 inset-0 bg-[#000000] flex items-center justify-center overflow-hidden">
      <div
        className={`relative ${animationStage === 'fade-out' ? 'opacity-0' : 'opacity-100'}`}
        style={{ transition: 'opacity 1s ease-out' }}
      >
        <div className="flex items-center justify-center">
          <div
            className={`origin-center transition-scale duration-500 ease-in-out ${
              animationStage === 'initial' ? 'scale-0' : 'scale-100'
            }`}
            style={{
              transition:
                animationStage === 'logo-appear'
                  ? 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  : 'transform 0.6s ease-out',
            }}
          >
            <img src="/Seerial_logo.svg" alt="Logo" className="w-[20dvh]" />
          </div>

          <div
            className={`${
              animationStage === 'text-appear' || animationStage === 'fade-out'
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-50'
            }`}
            style={{
              transition:
                'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            <span className="text-8xl font-black text-white">eerial</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoIntro;
