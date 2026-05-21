import type { Library, LibraryTypes } from '@seerial/domain';
import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import { useNavigate } from 'react-router';
import { NavigationButton, NavigationContainer } from '@/shared/components/navigation';

interface LibrariesListProps {
  type: LibraryTypes;
  libraries: Library[];
  show: boolean;
  hide: () => void;
  hideWithoutFocusRestore: () => void;
}

function LibrariesList({
  type,
  libraries,
  show,
  hide,
  hideWithoutFocusRestore,
}: LibrariesListProps) {
  const navigate = useNavigate();
  if (!libraries) return null;

  return (
    <LazyMotion features={domAnimation}>
      <NavigationContainer className="fixed z-50 flex justify-center items-center top-10 w-screen px-25">
        <AnimatePresence>
          {show && (
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="flex justify-center overflow-x-auto p-3 rounded-xl gap-2"
            >
              {libraries.map((library) => (
                <NavigationButton
                  key={library.id}
                  customKey={library.id}
                  onArrowPress={(direction) => {
                    if (direction === 'up') {
                      hide();
                      return false;
                    }

                    if (direction === 'down') {
                      hideWithoutFocusRestore();
                    }

                    return true;
                  }}
                  onClick={() => {
                    hide();
                    navigate(`/library/${library.id}/${type}`);
                  }}
                  text={library.name}
                  variant="ghost"
                />
              ))}
            </m.div>
          )}
        </AnimatePresence>
      </NavigationContainer>
    </LazyMotion>
  );
}

export default LibrariesList;
