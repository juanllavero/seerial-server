import type { Collection, DetailsData } from '@seerial/domain';
import { memo } from 'react';
import BackgroundImage from '@/components/backgrounds/BackgroundImage';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import DetailsInfo from '@/shared/components/details/details-info';
import Page from '@/shared/components/page';

interface CollectionDetailsProps {
  collection: Collection | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
}

function CollectionDetails({ collection, isLoading, details }: CollectionDetailsProps) {
  if (!isLoading && !collection) return <span>Collection not found</span>;

  return (
    <Page justify="end">
      <GradientBackground
        imageSrc={details?.backgroundSrc ?? collection?.backgroundSrc ?? collection?.coverSrc}
        index={0}
      />
      <BackgroundImage
        imageSrc={details?.backgroundSrc ?? collection?.backgroundSrc ?? collection?.coverSrc}
      />
      <DetailsInfo details={details} infoItems={[details?.year ?? 'N/A']} />
    </Page>
  );
}

export default memo(CollectionDetails);
