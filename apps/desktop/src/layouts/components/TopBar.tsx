import { useGetLibraries } from '@seerial/api';
import type { Library } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import FocusableButton from '@/components/navigation/NavigationButton';
import NavigationContainer from '@/components/navigation/NavigationContainer';
import { LibraryTypes } from '@/data/enums/enums';
import LibrariesList from './LibrariesList';

function TopBar() {
  const navigate = useNavigate();
  const [showLibraries, setShowLibraries] = useState(false);
  const [libraryType, setLibraryType] = useState<LibraryTypes>(LibraryTypes.MOVIES);

  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');

  const { data: libraries } = useGetLibraries<Library[]>({
    enabled: serverUrl !== '',
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const showMovies =
    libraries && libraries.filter((library) => library.type === LibraryTypes.MOVIES).length > 0;
  const showSeries =
    libraries && libraries.filter((library) => library.type === LibraryTypes.SHOWS).length > 0;
  const showMusic =
    libraries && libraries.filter((library) => library.type === LibraryTypes.MUSIC).length > 0;

  return (
    <NavigationContainer
      customFocusKey="topBar"
      className="relative flex justify-between items-center w-screen px-5 py-8 z-10"
    >
      <img src="/Seerial_logo.svg" alt="Logo" className="w-[5dvh]" />
      <div className="flex gap-2">
        <FocusableButton customKey="home" onClick={() => navigate('/home')}>
          Home
        </FocusableButton>
        <FocusableButton
          customKey="movies"
          disabled={!showMovies}
          onClick={() => {
            if (libraryType === LibraryTypes.MOVIES || !showLibraries) {
              setShowLibraries(!showLibraries);
            }
            setLibraryType(LibraryTypes.MOVIES);
          }}
        >
          Movies
        </FocusableButton>
        <FocusableButton
          customKey="shows"
          disabled={!showSeries}
          onClick={() => {
            if (libraryType === LibraryTypes.SHOWS || !showLibraries) {
              setShowLibraries(!showLibraries);
            }
            setLibraryType(LibraryTypes.SHOWS);
          }}
        >
          Shows
        </FocusableButton>
        <FocusableButton
          customKey="music"
          disabled={!showMusic}
          onClick={() => {
            if (libraryType === LibraryTypes.MUSIC || !showLibraries) {
              setShowLibraries(!showLibraries);
            }
            setLibraryType(LibraryTypes.MUSIC);
          }}
        >
          Music
        </FocusableButton>
        <FocusableButton customKey="myList" onClick={() => navigate('/myList')}>
          My List
        </FocusableButton>
      </div>
      <div>
        <FocusableButton customKey="settings">
          <Settings />
        </FocusableButton>
      </div>

      <LibrariesList
        type={libraryType}
        libraries={libraries || []}
        show={showLibraries}
        hide={() => setShowLibraries(false)}
      />
    </NavigationContainer>
  );
}

export default TopBar;
