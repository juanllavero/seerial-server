import { ContinueWatchingElement } from '@seerial/domain';
import FlexBox from '@/components/ui/FlexBox';
import Image from '@/components/ui/Image';

interface HomeInfoProps {
  selectedElement: ContinueWatchingElement | null;
}

function HomeInfo({ selectedElement }: HomeInfoProps) {
  return (
    <FlexBox direction="column" justify="end" className="justify-end pr-64 z-10">
      {selectedElement ? (
        <>
          {selectedElement.logoImage && selectedElement.logoImage !== '' ? (
            <Image
              className="mb-5"
              height={'15dvh'}
              aspectRatio="3/2"
              url={selectedElement.logoImage}
            />
          ) : (
            <span className="font-black text-5xl">{selectedElement.title}</span>
          )}

          {selectedElement.subtitle && (
            <span className="font-black text-4xl">{selectedElement.subtitle}</span>
          )}

          <FlexBox gap={1} className="flex-row pb-3 font-semibold text-lg">
            {selectedElement.seasonNumber && selectedElement.episodeNumber && (
              <span>
                S{selectedElement.seasonNumber}E{selectedElement.episodeNumber}
              </span>
            )}

            <span>{selectedElement.date}</span>
            <span>
              {(selectedElement.duration - selectedElement.timeWatched).toFixed(0)} minutes
              remaining
            </span>
          </FlexBox>

          <span className="pb-5 font-semibold text-md">
            {selectedElement.genres ? selectedElement.genres.join(', ') : ''}
          </span>

          <FlexBox height={'8dvh'} width={'50dvw'} className="max-w-[100dvh]">
            <span className="line-clamp-3 font-semibold text-md">{selectedElement.overview}</span>
          </FlexBox>
        </>
      ) : null}
    </FlexBox>
  );
}

export default HomeInfo;
