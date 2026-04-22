import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';

const NOW_PLAYING_BAR_ANIMATION = [0.35, 1, 0.55, 0.85, 0.35];

function AnimatedSoundBars({
  isPlaying,
  isSelected = false,
  translate = true,
}: {
  isPlaying: boolean;
  isSelected?: boolean;
  translate?: boolean;
}) {
  return (
    <AnimatePresence initial={true}>
      {!!isPlaying && (
        <motion.div
          key="now-playing-bars"
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`pointer-events-none top-1/2 right-full -translate-y-1/2 ${translate ? 'mr-[1.4vh] absolute' : 'translate-y-1'}`}
        >
          <div className="pointer-events-none flex h-[2.2vh] items-end gap-[0.25vh]">
            {[0, 0.18, 0.36, 0.54].map((delay) => (
              <motion.span
                key={`now-playing-bar-${delay}`}
                className="w-[0.36vh] rounded-none"
                style={{
                  height: '100%',
                  transformOrigin: 'bottom',
                  backgroundColor: isSelected ? 'black' : 'white',
                }}
                animate={{
                  scaleY: NOW_PLAYING_BAR_ANIMATION,
                }}
                transition={{
                  duration: 1.1,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                  delay,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(AnimatedSoundBars);
