import type { Library, LibraryTypes } from '@seerial/domain';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import NavigationButton from '@/components/navigation/NavigationButton';
import NavigationContainer from '@/components/navigation/NavigationContainer';

interface LibrariesListProps {
  type: LibraryTypes;
  libraries: Library[];
  show: boolean;
  hide: () => void;
}

function LibrariesList({ type, libraries, show, hide }: LibrariesListProps) {
  const navigate = useNavigate();
  if (!libraries) return null;

  return (
    <NavigationContainer className="fixed z-50 flex justify-center items-center top-15 w-screen px-25">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </NavigationContainer>
  );
}

export default LibrariesList;
