import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetContinueWatching } from '@seerial/api';
import { type ContinueWatchingVideoDTO, formatDate } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import NavigationScrollView from '@/components/navigation/NavigationScrollView';
import ListTitle from '@/components/text/ListTitle';
import TransparentImage from '@/features/home/components/transparent-image';
import DetailsInfo from '@/shared/components/details/details-info';
import Loading from '@/shared/components/loading';
import Page from '@/shared/components/page';
import ContentCard from '@/shared/ui/card';

function Home() {
  const { currentUser } = useServerStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedServer } = useServerStore();
  const serverUrl = selectedServer?.url ?? '';
  const [selectedElement, setSelectedElement] = useState<ContinueWatchingVideoDTO | null>(null);

  //Get Continue Watching items
  const { data: continueWatching, isLoading } = useGetContinueWatching<ContinueWatchingVideoDTO[]>({
    enabled: !!selectedServer && !!serverUrl && !!currentUser?.id,
    params: currentUser?.id ? { userId: currentUser.id } : undefined,
  });

  useEffect(() => {
    if (continueWatching && continueWatching.length > 0)
      setFocus(`continueWatchingCard-${continueWatching[0].id}`);
  }, [continueWatching]);

  useEffect(() => {
    if (continueWatching && continueWatching.length > 0) {
      setSelectedElement(continueWatching[0]);
      setFocus(`${continueWatching[0].id}`);
    } else {
      setSelectedElement(null);
      setFocus('home');
    }
  }, [continueWatching]);

  const goToContent = (url: string) => {
    navigate(url);
  };

  return (
    <Page justify="end">
      <GradientBackground
        imageSrc={selectedElement?.backgroundImage ?? selectedElement?.posterImage}
        index={0}
      />

      <TransparentImage imageSrc={selectedElement?.backgroundImage ?? ''} />

      {/* <HomeInfo selectedElement={selectedElement} /> */}
      <DetailsInfo
        details={{
          title: selectedElement?.title ?? '',
          subtitle: selectedElement?.subtitle ?? '',
          genres: selectedElement?.genres.join(', ') ?? '',
          description: selectedElement?.overview ?? '',
        }}
        infoItems={
          [
            selectedElement?.episodeNumber
              ? `S${selectedElement.seasonNumber}E${selectedElement.episodeNumber}`
              : undefined,
            selectedElement?.episodeId
              ? formatDate(selectedElement?.date ?? '')
              : selectedElement?.date.split('-')[0],
            selectedElement
              ? `${(selectedElement.duration - selectedElement.timeWatched / 60).toFixed(0)} minutes remaining`
              : undefined,
          ].filter(Boolean) as string[]
        }
        hideButtons
      />

      <ListTitle className="z-10 mt-5">{t('continueWatching')}</ListTitle>

      {/* <LogoIntro /> */}

      <NavigationScrollView
        className="gap-5 pb-5 z-10 w-full"
        direction="horizontal"
        scrollMode="start"
        focusedElementId={selectedElement?.id}
      >
        {continueWatching && continueWatching.length > 0 ? (
          continueWatching.map((element: ContinueWatchingVideoDTO) => (
            <ContentCard
              key={element.id}
              imgSrc={element.posterImage ?? ''}
              customKey={element.id}
              width={'26dvh'}
              noInfo
              onFocus={() => setSelectedElement(element)}
              aspectRatio="2/3"
              action={() => {
                if (element.id === selectedElement?.id) {
                  goToContent(
                    `/details/${element.episodeId ? 'episode' : 'movie'}/${element.episodeId ? element.episodeId : element.movieId}`,
                  );
                } else {
                  setSelectedElement(element);
                }
              }}
            />
          ))
        ) : isLoading ? (
          t('noContent')
        ) : (
          <Loading />
        )}
      </NavigationScrollView>
    </Page>
  );
}

export default Home;
