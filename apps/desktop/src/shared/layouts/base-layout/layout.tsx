import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const pageTransition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

const BaseLayout = () => {
  const location = useLocation();

  return (
    <div
      className="seerial-app-shell w-full h-full m-0 flex flex-col items-center justify-end overflow-hidden"
      style={{ backgroundColor: 'var(--seerial-app-shell-background, black)' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.key}
          className="w-full flex-1 min-h-0"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default memo(BaseLayout);
