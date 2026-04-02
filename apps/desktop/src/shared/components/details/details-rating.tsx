import type { DetailsData } from '@seerial/domain';
import Tertiary from '@/components/text/Tertiary';
import FlexBox from '@/components/ui/FlexBox';

interface DetailsRatingProps {
  details: DetailsData | undefined;
}

function DetailsRating({ details }: DetailsRatingProps) {
  if (details?.imdbScore && details.imdbScore !== -1) {
    return (
      <FlexBox className="flex-row space-x-3">
        <Tertiary>{details.imdbScore.toFixed(2)}</Tertiary>
        <img src="/img/logos/imdb.png" alt="IMDb Logo" className="self-center max-h-[2vh]" />
      </FlexBox>
    );
  }

  if (details?.score) {
    return (
      <FlexBox className="flex-row space-x-3">
        <Tertiary>{details.score.toFixed(2)}</Tertiary>
        <img
          src="/svg/themoviedb.svg"
          alt="The Movie Database Logo"
          className="self-center max-h-[2vh]"
        />
      </FlexBox>
    );
  }

  return null;
}

export default DetailsRating;
