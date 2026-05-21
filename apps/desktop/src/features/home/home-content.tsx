import { type ContinueWatchingVideoDTO, formatDate } from '@seerial/domain';
import HomeHeroImage from '@/features/home/components/home-hero-image';
import GradientBackground from '@/shared/components/backgrounds/gradient-background';
import DetailsInfo from '@/shared/components/details/details-info';
import ContinueWatchingContent from './components/continue-watching-content';

function getSelectedInfoItems(selectedElement: ContinueWatchingVideoDTO | null) {
  if (!selectedElement) {
    return [];
  }

  const episodeCode = selectedElement.episodeNumber
    ? `S${selectedElement.seasonNumber}E${selectedElement.episodeNumber}`
    : undefined;
  const releaseDate = selectedElement.episodeId
    ? formatDate(selectedElement.date ?? '')
    : selectedElement.date.split('-')[0];
  const remainingMinutes = `${(selectedElement.duration - selectedElement.timeWatched / 60).toFixed(0)} minutes remaining`;

  return [episodeCode, releaseDate, remainingMinutes].filter(Boolean) as string[];
}

interface HomePageContentProps {
  continueWatching: ContinueWatchingVideoDTO[];
  selectedElement: ContinueWatchingVideoDTO | null;
  setSelectedElement: React.Dispatch<React.SetStateAction<ContinueWatchingVideoDTO | null>>;
}

function HomePageContent({
  continueWatching,
  selectedElement,
  setSelectedElement,
}: HomePageContentProps) {
  const imageSrc = selectedElement?.backgroundImage ?? selectedElement?.posterImage;
  const infoItems = getSelectedInfoItems(selectedElement);

  return (
    <>
      <GradientBackground imageSrc={imageSrc} index={0} />
      <HomeHeroImage imageSrc={imageSrc} />

      <DetailsInfo
        details={{
          title: selectedElement?.title ?? '',
          subtitle: selectedElement?.subtitle ?? '',
          genres: selectedElement?.genres.join(', ') ?? '',
          description: selectedElement?.overview ?? '',
        }}
        durationInfo={selectedElement?.duration}
        timeWatchedInfo={selectedElement?.timeWatched}
        infoItems={infoItems}
        behaviorOptions={{
          enableKeyboardBack: false,
        }}
        displayOptions={{
          hideButtons: true,
        }}
      />

      {/* <LogoIntro /> */}

      <ContinueWatchingContent
        continueWatching={continueWatching}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
      />
    </>
  );
}

export default HomePageContent;
