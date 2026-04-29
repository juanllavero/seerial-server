import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import type { ItemType, LibraryType } from '@seerial/domain';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useRef, useState } from 'react';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import ChevronIndicator from './chevron-indicator';
import RelatedContentContext from './related-content-context';
import RelatedContentPage from './related-content-page';

interface DetailsWithRelatedContentProps {
  children: React.ReactNode;
  collectionId?: string;
  currentItemId?: string;
  currentItemType?: ItemType;
  libraryType?: LibraryType;
}

const slideTransition = {
  type: 'tween' as const,
  duration: 0.35,
  ease: 'easeInOut' as const,
};

function DetailsWithRelatedContent({
  children,
  collectionId,
  currentItemId,
  currentItemType,
  libraryType,
}: DetailsWithRelatedContentProps) {
  const [isRelatedVisible, setIsRelatedVisible] = useState(false);
  const previousFocusRef = useRef<string>(NavigationFocusKeys.details.playButton);
  const hasRelatedContent = !!collectionId;

  const navigateToRelated = useCallback(() => {
    if (!collectionId) return;
    previousFocusRef.current =
      document.querySelector("[data-focused='true']")?.getAttribute('data-focus-key') ??
      NavigationFocusKeys.details.playButton;
    setIsRelatedVisible(true);
  }, [collectionId]);

  const navigateFromRelated = useCallback(() => {
    setIsRelatedVisible(false);
    requestAnimationFrame(() => {
      setFocus(previousFocusRef.current);
    });
  }, []);

  const contextValue = {
    navigateToRelated,
    hasRelatedContent,
  };

  return (
    <RelatedContentContext.Provider value={contextValue}>
      <div className="relative w-screen h-screen overflow-hidden">
        <motion.div
          className="absolute inset-0 w-full h-full"
          animate={{ x: isRelatedVisible ? '-100%' : '0%' }}
          transition={slideTransition}
        >
          {children}
          <AnimatePresence>
            {hasRelatedContent && !isRelatedVisible && <ChevronIndicator />}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="absolute top-0 left-full w-full h-full"
          animate={{ x: isRelatedVisible ? '-100%' : '0%' }}
          transition={slideTransition}
        >
          {hasRelatedContent && (
            <RelatedContentPage
              collectionId={collectionId}
              currentItemId={currentItemId}
              currentItemType={currentItemType}
              libraryType={libraryType}
              isVisible={isRelatedVisible}
              onNavigateBack={navigateFromRelated}
            />
          )}
        </motion.div>
      </div>
    </RelatedContentContext.Provider>
  );
}

export default memo(DetailsWithRelatedContent);
