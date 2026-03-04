import Tertiary from '@/components/text/Tertiary'
import Title from '@/components/text/Title'
import { Movie } from '@/data/interfaces/Media'
import { Ellipsis, LucideBookmark } from 'lucide-react-native'
import React, { useCallback } from 'react'
import { View } from 'react-native'
import Button from '@/components/buttons/Button'
import { SpatialNavigationView, DefaultFocus } from 'react-tv-space-navigation'
import AlignedImage from '@/components/images/AlignedImage'
import { scaledPixels } from '@/hooks/useScale'
import { formatTimeForView, getOnlyYear } from '@/utils/utils'
import PlayIcon from '@/components/svg/player/controls/PlayIcon'

interface MovieInfoProps {
	movie: Movie
}

function MovieInfo({ movie }: MovieInfoProps) {
	const handleMoreOptions = useCallback(() => {}, [])

	return (
		<View className='gap-3 pb-10 justify-end h-screen'>
			{movie.logoSrc && movie.logoSrc !== '' ? (
				<AlignedImage
					className='pb-5'
					height={scaledPixels(130)}
					maxWidth={scaledPixels(500)}
					imageUrl={movie.logoSrc}
				/>
			) : (
				<Title>{movie.name}</Title>
			)}
			<View className='gap-1'>
				<View className='flex-row gap-3'>
					<Tertiary>{getOnlyYear(movie.year)}</Tertiary>
					{movie.videos && movie.videos.length === 1 && (
						<Tertiary>
							{formatTimeForView(movie.videos[0].runtime)}
						</Tertiary>
					)}
				</View>
				<View className='flex-row gap-3'>
					<Tertiary>{movie.imdbScore}</Tertiary>
				</View>
				<Tertiary>{movie.genres.join(', ')}</Tertiary>

				<View
					style={{
						maxWidth: scaledPixels(500),
						height: scaledPixels(40),
						paddingTop: 3,
					}}
				>
					<Tertiary>{movie.overview}</Tertiary>
				</View>
			</View>

			<SpatialNavigationView
				style={{
					justifyContent: 'flex-start',
					paddingTop: 5,
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

export default MovieInfo
