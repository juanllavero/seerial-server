import { type Album, type DetailsData, formatDate } from '@seerial/domain';
import { memo } from 'react';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import DetailsInfo from '@/shared/components/details/details-info';
import Page from '@/shared/components/page';

interface AlbumDetailsProps {
  album: Album | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
}

function AlbumDetails({ album, isLoading, details }: AlbumDetailsProps) {
  if (!isLoading && !album) return <span>Album not found</span>;

  return (
    <Page padding="0 2rem" justify="end">
      <GradientBackground imageSrc={details?.coverSrc ?? album?.coverSrc ?? ''} index={0} />
      <DetailsInfo details={details} infoItems={[formatDate(details?.year ?? album?.year ?? '')]} />

      {/* Selected Album Songs */}
    </Page>
  );
}

export default memo(AlbumDetails);
