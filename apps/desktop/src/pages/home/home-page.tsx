import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetContinueWatching } from '@seerial/api';
import type { ContinueWatchingVideoDTO } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import NavigationScrollView from '@/components/navigation/NavigationScrollView';
import HomeInfo from '@/features/home/components/home-info';
import TransparentImage from '@/features/home/components/transparent-image';
import Page from '@/shared/components/page';
import ContentCard from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

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
    setFocus('home');
  }, []);

  const goToContent = (url: string) => {
    navigate(url);
  };

  const skeletons = Array.from({ length: 10 }, (_, index) => (
    <Skeleton key={`ContinueWatching ${index}`} className={'w-[280px] h-[400px]'} />
  ));

  return (
    <Page justify="end">
      <p>Test</p>
      <GradientBackground
        imageSrc={selectedElement?.backgroundImage ?? selectedElement?.posterImage}
        index={0}
      />

      <TransparentImage imageSrc={selectedElement?.backgroundImage ?? ''} />

      <HomeInfo selectedElement={selectedElement} />

      <span className="text-xl z-10">{t('continueWatching')}</span>

      {/* <LogoIntro /> */}

      <NavigationScrollView
        direction="horizontal"
        className="gap-10 w-full z-10"
        customFocusKey="continueWatching"
      >
        {continueWatching && continueWatching.length > 0
          ? continueWatching.map((element: ContinueWatchingVideoDTO) => (
              <ContentCard
                key={element.id}
                imgSrc={element.posterImage ?? ''}
                customKey={`continueWatchingCard-${element.id}`}
                height={'35dvh'}
                title={element.title}
                onFocus={() => setSelectedElement(element)}
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
          : isLoading
            ? t('noContent')
            : skeletons}
      </NavigationScrollView>
    </Page>
  );
}

export default Home;
