import { type Album, type DetailsData, formatDate } from '@seerial/domain';
import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import BackgroundImage from '@/components/backgrounds/BackgroundImage';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import AppAlertDialog from '@/shared/components/app-alert-dialog';
import DetailsInfo from '@/shared/components/details/details-info';
import Page from '@/shared/components/page';

interface AlbumDetailsProps {
  album: Album | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
}

function AlbumDetails({ album, isLoading, details }: AlbumDetailsProps) {
  const navigate = useNavigate();
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !album) {
      setIsErrorDialogOpen(true);
    }
  }, [album, isLoading]);

  return (
    <Page padding="0 2rem" justify="end">
      <GradientBackground imageSrc={details?.coverSrc ?? album?.coverSrc ?? ''} index={0} />
      <BackgroundImage imageSrc={details?.coverSrc ?? album?.coverSrc} />
      <DetailsInfo details={details} infoItems={[formatDate(details?.year ?? album?.year ?? '')]} />

      {/* Selected Album Songs */}

      <AppAlertDialog
        open={isErrorDialogOpen}
        subtitle={'The album details could not be loaded. Please try again later.'}
        title="Album not found"
        primaryAction={{
          label: 'Go back',
          onPress: () => navigate(-1),
        }}
      />
    </Page>
  );
}

export default memo(AlbumDetails);
