import { useGetAlbum } from '@seerial/api';
import type { Album, DetailsData } from '@seerial/domain';
import { memo } from 'react';
import { useLocation, useParams } from 'react-router';
import AlbumDetails from '@/features/details/album/album-details';

function AlbumDetailsPage() {
  const { albumId } = useParams();
  const { state } = useLocation();
  const cachedDetails: DetailsData | undefined = state?.cachedDetails;

  const { data: album, isLoading } = useGetAlbum<Album>(albumId ?? '', {
    enabled: !!albumId,
  });

  return <AlbumDetails album={album} isLoading={isLoading} details={cachedDetails} />;
}

export default memo(AlbumDetailsPage);
