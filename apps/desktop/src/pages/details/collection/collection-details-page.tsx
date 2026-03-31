import { useGetCollection } from '@seerial/api';
import type { Collection, DetailsData, LibraryType } from '@seerial/domain';
import { memo } from 'react';
import { useLocation, useParams } from 'react-router';
import CollectionDetails from '@/features/details/collection/collection-details';

function CollectionDetailsPage() {
  const { collectionId } = useParams();
  const { state } = useLocation();
  const cachedDetails: DetailsData | undefined = state?.cachedDetails;
  const libraryType = state?.libraryType as LibraryType | undefined;

  const { data: collection, isLoading } = useGetCollection<Collection>(collectionId ?? '', {
    enabled: !!collectionId,
  });

  return (
    <CollectionDetails
      collection={collection}
      libraryType={libraryType as LibraryType}
      isLoading={isLoading}
      details={cachedDetails}
    />
  );
}

export default memo(CollectionDetailsPage);
