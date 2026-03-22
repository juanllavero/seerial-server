import { useGetCollection } from '@seerial/api';
import type { Collection } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { memo, useMemo } from 'react';
import { useParams } from 'react-router';
import { shallow } from 'zustand/shallow';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import Loading from '@/components/Loading';
import Page from '@/components/Page';
import { LibraryTypes } from '@/data/enums/enums';
import DetailsInfo from '../components/DetailsInfo';

function CollectionDetails() {
  const { collectionId, type } = useParams();
  const { serverUrl } = useServerStore(
    (state) => ({
      serverUrl: state.selectedServer?.url ?? '',
    }),
    shallow,
  );

  const { data: collection, isLoading } = useGetCollection<Collection>(collectionId ?? '', {
    enabled: !!collectionId && serverUrl !== '',
  });

  const yearRange = useMemo(() => {
    if (!collection) return 'N/A';

    const getYears = (items: any[] | undefined) =>
      items?.map((item) => item.year).filter(Boolean) || [];

    let years: (string | undefined)[] = [];
    switch (type) {
      case LibraryTypes.MUSIC:
        years = getYears(collection.albums);
        break;
      case LibraryTypes.MOVIES:
        years = getYears(collection.movies);
        break;
      case LibraryTypes.SHOWS:
        years = getYears(collection.shows);
        break;
    }

    if (years.length === 0) return 'N/A';

    const numericYears = years.map((year) => parseInt(year!, 10));
    const minYear = Math.min(...numericYears);
    const maxYear = Math.max(...numericYears);

    return minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`;
  }, [collection, type]);

  if (isLoading) {
    return <Loading />;
  }

  if (!collection) return <span>Collection not found</span>;

  return (
    <Page padding="0 2rem" justify="end">
      <GradientBackground imageSrc={collection?.backgroundSrc ?? collection?.coverSrc} index={0} />
      <DetailsInfo
        title={collection.title}
        overview={collection.description}
        infoItems={[yearRange]}
      />
    </Page>
  );
}

export default memo(CollectionDetails);
