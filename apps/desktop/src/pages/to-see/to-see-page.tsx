import { useGetLibraries } from '@seerial/api';
import { type Library, LibraryTypes } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import ToSee from '@/features/to-see/to-see';
import Loading from '@/shared/components/loading';

function ToSeePage() {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');

  const { data: libraries, isLoading } = useGetLibraries<Library[]>({
    enabled: serverUrl !== '',
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const moviesLibraries = libraries?.filter((library) => library.type === LibraryTypes.MOVIES);
  const seriesLibraries = libraries?.filter((library) => library.type === LibraryTypes.SHOWS);

  if (isLoading) {
    return <Loading />;
  }

  if (!libraries) {
    return <div>{'Error fetching libraries.'}</div>;
  }

  return <ToSee moviesLibraries={moviesLibraries ?? []} seriesLibraries={seriesLibraries ?? []} />;
}

export default ToSeePage;
