import AnimatedCard from '@/components/cards/AnimatedCard'
import OptimizedImage from '@/components/images/OptimizedImage'
import { Episode } from '@/data/interfaces/Media'
import React from 'react'
import { View } from 'react-native'
import { SpatialNavigationFocusableView } from 'react-tv-space-navigation'

interface EpisodeCardProps {
	episode: Episode
	width: number
	setSelectedEpisode: React.Dispatch<React.SetStateAction<Episode | null>>
}

function EpisodeCard({ episode, width, setSelectedEpisode }: EpisodeCardProps) {
	return (
		<SpatialNavigationFocusableView
			onSelect={() => {}}
			onFocus={() => setSelectedEpisode(episode)}
		>
			{({ isFocused }) => (
				<AnimatedCard isFocused={isFocused} width={width}>
					<View>
						<OptimizedImage
							source={{ uri: episode.video.imgSrc }}
							style={{
								width,
								height: width * (9 / 16),
								borderWidth: 1.5,
								borderRadius: 0,
								borderColor: isFocused ? 'white' : 'transparent',
							}}
						/>
					</View>
				</AnimatedCard>
			)}
		</SpatialNavigationFocusableView>
	)
}

export default EpisodeCard
