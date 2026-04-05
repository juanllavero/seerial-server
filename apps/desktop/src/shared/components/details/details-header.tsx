import type { DetailsData } from '@seerial/domain';
import AlignedImage from '@/components/images/AlignedImage';
import Subtitle from '@/components/text/Subtitle';
import Title from '@/components/text/Title';

interface DetailsHeaderProps {
  details: DetailsData | undefined;
  subtitle?: string;
}

function DetailsHeader({ details, subtitle }: DetailsHeaderProps) {
  return (
    <>
      <span className="text-[1.5vh] italic">
        {details?.tagline && details.tagline !== '' ? details.tagline : ''}
      </span>

      {details?.logoSrc && details.logoSrc !== '' ? (
        <AlignedImage
          className="mt-5 pb-5"
          //height={bigLogo ? 300 : 120}
          maxWidth={1100}
          imageUrl={details.logoSrc}
        />
      ) : (
        <Title className={`leading-none ${subtitle || details?.subtitle ? '' : 'mb-5'}`}>
          {details?.title}
        </Title>
      )}

      {details?.subtitle && <Subtitle>{subtitle ?? details.subtitle}</Subtitle>}

      {details?.createdBy ? (
        <span className="text-[1.5vh] italic mb-5">{`Created by ${details.createdBy}`}</span>
      ) : details?.directedBy ? (
        <span className="text-[1.5vh] italic mb-5">{`Directed by ${details.directedBy}`}</span>
      ) : null}
    </>
  );
}

export default DetailsHeader;
