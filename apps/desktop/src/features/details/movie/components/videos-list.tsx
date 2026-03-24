import type { Video } from '@seerial/domain';
import { memo } from 'react';

interface VideosListProps {
  selectedVideo: Video | null;
  selectVideo: (video: Video | null) => void;
}

function VideosList() {
  return null;
  // const serverUrl = useServerStore((state) => state.serverUrl)
  // const navigate = useNavigate()

  // return (
  // 	<NavigationScrollView className='gap-5 pb-5'>
  // 		{season?.episodes.map((episode) => (
  // 			<div
  // 				key={episode.id}
  // 				className={`cursor-pointer border-4 border-transparent ${selectedEpisode?.id === episode.id ? ' border-white' : ''}`}
  // 				style={{
  // 					width: 300,
  // 				}}
  // 				onClick={() => {
  // 					if (selectedEpisode?.id === episode.id) {
  // 						navigate(`/video-player/${episode.video.id}`)
  // 					} else {
  // 						selectEpisode(episode)
  // 					}
  // 				}}
  // 			>
  // 				<AnimatedImage
  // 					uri={episode.video.imgSrc}
  // 					style={{
  // 						aspectRatio: '16/9',
  // 						objectFit: 'cover',
  // 					}}
  // 				/>
  // 			</div>
  // 		))}
  // 	</NavigationScrollView>
  // )
}

export default memo(VideosList);
