import { useGradientStore } from "@seerial/stores";
import { useMatch, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import GradientBackground from "@/components/backgrounds/GradientBackground";
import TopBar from "./components/top-bar";

const pageVariants = {
  initial: { x: "4%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "-4%", opacity: 0 },
};

const pageTransition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1] as const, // cubic-bezier suave, TV-friendly
};

const BaseLayout = ({ children }: { children: React.ReactNode }) => {
  const gradientImageSrc = useGradientStore((state) => state.gradientImageSrc);
  const location = useLocation();

  const isMovieDetails = useMatch("details/movie/:movieId");
  const isSeriesDetails = useMatch("details/series/:seriesId");
  const isAlbumDetails = useMatch("details/album/:albumId");
  const hideTopBar = !!(isMovieDetails || isSeriesDetails || isAlbumDetails);

  return (
    <div
      className="seerial-app-shell w-full h-full m-0 flex flex-col items-center justify-end overflow-hidden"
      style={{ backgroundColor: "var(--seerial-app-shell-background, black)" }}
    >
      <GradientBackground imageSrc={gradientImageSrc} index={0} />
      {!hideTopBar && <TopBar />}

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
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BaseLayout;