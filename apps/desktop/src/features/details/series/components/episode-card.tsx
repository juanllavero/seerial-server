import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import type { Episode } from '@seerial/domain';
import { useNavigate } from 'react-router';
import Image from '@/components/ui/Image';

interface EpisodeCardProps {
  episode: Episode;
  selectedEpisodeId?: string;
  outOfFocus?: boolean;
  onFocus?: (episode: Episode) => void;
}

function EpisodeCard({ episode, selectedEpisodeId, outOfFocus, onFocus }: EpisodeCardProps) {
  const navigate = useNavigate();
  const { ref, focused } = useFocusable({
    focusKey: episode.id,
    onFocus: () => onFocus?.(episode),
    onEnterPress: handlePlay,
  });

  function handlePlay() {
    navigate(`/video-player/${episode.video.id}`);
  }

  return (
    <div
      ref={ref}
      data-focus-key={episode.id}
      className={`shrink-0 p-0 ${outOfFocus && selectedEpisodeId !== episode.id ? 'opacity-50' : ''}`}
      style={{
        height: '22vh',
      }}
    >
      <Image
        url={episode.video.imgSrc}
        height="100%"
        width="100%"
        className={`h-full w-full rounded-md scale-95 border-2 border-transparent transition-all duration-50 ${focused ? 'transform scale-100 border-white' : ''}`}
        aspectRatio="16/9"
      />
    </div>
  );
}

export default EpisodeCard;
