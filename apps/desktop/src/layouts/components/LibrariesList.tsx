import type { Library } from '@seerial/domain';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import FocusableButton from '@/components/navigation/NavigationButton';
import NavigationContainer from '@/components/navigation/NavigationContainer';
import type { LibraryTypes } from '@/data/enums/enums';

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
    <NavigationContainer className="fixed z-50 flex justify-center items-center top-20 w-screen">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="flex justify-start overflow-x-auto bg-black/70 p-3 rounded-xl gap-2"
          >
            {libraries
              .filter((library) => library.type === type)
              .map((library) => (
                <FocusableButton
                  key={library.id}
                  customKey={library.id}
                  onClick={() => {
                    hide();
                    navigate(`/library/${library.id}/${type}`);
                  }}
                >
                  {library.name}
                </FocusableButton>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </NavigationContainer>
  );
}

export default LibrariesList;
