import { useGetAlbum } from '@seerial/api';
import type { Album, DetailsData, LibraryType } from '@seerial/domain';
import { memo } from 'react';
import { useLocation, useParams } from 'react-router';
import { AlbumDetails } from '@/features/details';

function AlbumDetailsPage() {
  const { albumId } = useParams();
  const { state } = useLocation();
  const cachedDetails: DetailsData | undefined = state?.cachedDetails;
  const collectionId: string | undefined = state?.collectionId;
  const libraryType = state?.libraryType as LibraryType | undefined;

  const { data: album, isLoading } = useGetAlbum<Album>(albumId ?? '', {
    enabled: !!albumId,
  });

  return (
    <AlbumDetails
      album={album}
      isLoading={isLoading}
      details={cachedDetails}
      collectionId={collectionId}
      libraryType={libraryType}
    />
  );
}

export default memo(AlbumDetailsPage);
