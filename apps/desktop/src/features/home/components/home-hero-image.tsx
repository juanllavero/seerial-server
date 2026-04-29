import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Image from '@/shared/components/ui/image';

interface HomeHeroImageProps {
  imageSrc?: string;
}

function HomeHeroImage({ imageSrc }: HomeHeroImageProps) {
  const prefersReducedMotion = useReducedMotion();
  const [debouncedImageSrc, setDebouncedImageSrc] = useState<string | undefined>(imageSrc);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debouncedImageSrc === imageSrc) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setDebouncedImageSrc(imageSrc);
    }, 600);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, debouncedImageSrc]);

  return (
    <div className="pointer-events-none absolute top-0 right-0 z-0 h-[70vh] w-[70vw] overflow-hidden">
      <AnimatePresence mode="sync" initial={false}>
        {debouncedImageSrc ? (
          <motion.div
            key={debouncedImageSrc}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.05 : 0.35,
              ease: 'easeOut',
            }}
            style={{ willChange: 'opacity' }}
          >
            <Image
              url={debouncedImageSrc}
              height="70vh"
              width="70vw"
              aspectRatio="2/3"
              style={{
                maskImage: `
      linear-gradient(to right, transparent 0%, black 80%),
      linear-gradient(to top,   transparent 0%, black 80%)
    `,
                maskComposite: 'intersect',
                WebkitMaskImage: `
      linear-gradient(to right, transparent 0%, black 80%),
      linear-gradient(to top,   transparent 0%, black 80%)
    `,
                WebkitMaskComposite: 'source-in',
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default HomeHeroImage;
