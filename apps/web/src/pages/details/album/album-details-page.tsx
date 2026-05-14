import { API, useGet } from '@seerial/api';
import type { Album } from '@seerial/domain';
import { useGradientStore } from '@seerial/stores';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlbumContent, AlbumInfo } from '@/features/media-details';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useIsTablet } from '@/shared/hooks/use-tablet';
import FlexBox from '@/shared/ui/flex-box';
import NotFound from '@/shared/ui/not-found';
import { Skeleton } from '@/shared/ui/skeleton';
function AlbumDetailsPage() {
  const { albumId } = useParams();
  const selectBackground = useGradientStore((state) => state.selectBackground);

  // Get album data
  const { data: album, isLoading, error } = useGet<Album>(API.albums.get(albumId ?? ''));

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  useEffect(() => {
    if (album) {
      selectBackground(album.coverSrc);
    }
  }, [album, selectBackground]);

  if (error || !album) {
    return <NotFound />;
  }

  return (
    <FlexBox
      className={`details-container`}
      direction={!isMobile && !isTablet ? 'row' : 'column'}
      gap={1}
      wrap="nowrap"
      padding={isMobile ? '3rem 0' : '2rem 0 5rem 0'}
      align="center"
      width={'100%'}
      height={'100%'}
      css={{ overflowY: !isMobile && !isTablet ? 'hidden' : 'scroll' }}
    >
      <AlbumInfo isLoading={isLoading} album={album} />

      {/* Album Content */}
      {isLoading || !album ? <Skeleton className="h-300 w-200" /> : <AlbumContent album={album} />}
    </FlexBox>
  );
}

export default AlbumDetailsPage;
