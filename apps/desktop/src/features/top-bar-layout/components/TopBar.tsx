import { useGetLibraries } from '@seerial/api';
import { type Library, LibraryTypes } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import NavigationButton from '@/components/navigation/NavigationButton';
import NavigationContainer from '@/components/navigation/NavigationContainer';
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

  const moviesLibraries = libraries?.filter((library) => library.type === LibraryTypes.MOVIES);
  const seriesLibraries = libraries?.filter((library) => library.type === LibraryTypes.SHOWS);
  const albumsLibraries = libraries?.filter((library) => library.type === LibraryTypes.MUSIC);

  const showMovies = moviesLibraries && moviesLibraries.length > 0;
  const showSeries = seriesLibraries && seriesLibraries.length > 0;
  const showMusic = albumsLibraries && albumsLibraries.length > 0;

  return (
    <NavigationContainer
      customFocusKey="topBar"
      className="relative flex justify-between items-center w-screen px-5 py-8 z-10"
    >
      <img src="/Seerial_logo.svg" alt="Logo" className="w-[5dvh]" />
      <div className="flex gap-2">
        <NavigationButton customKey="home" onClick={() => navigate('/home')}>
          Home
        </NavigationButton>
        <NavigationButton
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
        </NavigationButton>
        <NavigationButton
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
        </NavigationButton>
        <NavigationButton
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
        </NavigationButton>
        <NavigationButton customKey="myList" onClick={() => navigate('/myList')}>
          My List
        </NavigationButton>
      </div>
      <div>
        <NavigationButton customKey="settings">
          <Settings />
        </NavigationButton>
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
