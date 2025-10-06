import Tertiary from '@/components/text/Tertiary'
import Title from '@/components/text/Title'
import { Episode, Series } from '@/data/interfaces/Media'
import { Ellipsis, LucideBookmark } from 'lucide-react-native'
import React, { useCallback } from 'react'
import { View } from 'react-native'
import Button from '@/components/buttons/Button'
import { SpatialNavigationView, DefaultFocus } from 'react-tv-space-navigation'
import AlignedImage from '@/components/images/AlignedImage'
import { scaledPixels } from '@/hooks/useScale'
import { formatDate, formatTimeForView, getOnlyYear } from '@/utils/utils'
import PlayIcon from '@/components/svg/player/controls/PlayIcon'
import Subtitle from '@/components/text/Subtitle'

interface SeriesInfoProps {
	series: Series
	currentEpisode: Episode | null
}

function SeriesInfo({ series, currentEpisode }: SeriesInfoProps) {
	const handleMoreOptions = useCallback(() => {}, [])

	return (
		<View
			className='pb-5 justify-end'
			style={{
				height: scaledPixels(380),
			}}
		>
			{series.logoSrc && series.logoSrc !== '' ? (
				<AlignedImage
					className='pb-5'
					height={scaledPixels(120)}
					maxWidth={scaledPixels(500)}
					imageUrl={series.logoSrc}
				/>
			) : (
				<Title>{series.name}</Title>
			)}
			{currentEpisode && (
				<Subtitle className='text-2xl pb-2'>{currentEpisode.name}</Subtitle>
			)}

			<View className='gap-1'>
				<View className='flex-row gap-3'>
					{currentEpisode && (
						<Tertiary>
							{'S' +
								currentEpisode.seasonNumber +
								' E' +
								currentEpisode.episodeNumber}
						</Tertiary>
					)}
					<Tertiary>
						{formatDate(
							currentEpisode ? currentEpisode.year : series.year
						)}
					</Tertiary>
					{currentEpisode && (
						<Tertiary>
							{formatTimeForView(currentEpisode.video.runtime)}
						</Tertiary>
					)}
				</View>
				<View className='flex-row gap-3'>
					<Tertiary>
						{currentEpisode
							? currentEpisode.score.toFixed(2)
							: series.score.toFixed(2)}
					</Tertiary>
				</View>
				<Tertiary>{series.genres.join(', ')}</Tertiary>
				<View
					style={{
						maxWidth: scaledPixels(500),
						height: scaledPixels(40),
						paddingTop: 3,
					}}
				>
					<Tertiary className='line-clamp-3 ellipsis'>
						{currentEpisode ? currentEpisode.overview : series.overview}
					</Tertiary>
				</View>
			</View>

			<SpatialNavigationView
				style={{
					justifyContent: 'flex-start',
					paddingTop: 15,
					gap: 10,
				}}
				direction='horizontal'
			>
				<DefaultFocus>
					<Button
						text={'Play'}
						icon={PlayIcon}
						onPress={() => console.log('Play')}
					/>
				</DefaultFocus>
				<Button
					text={''}
					icon={LucideBookmark}
					onPress={() => console.log('Edit')}
				/>
				<Button icon={Ellipsis} iconSize={22} onPress={handleMoreOptions} />
			</SpatialNavigationView>
		</View>
	)
}

export default SeriesInfo
