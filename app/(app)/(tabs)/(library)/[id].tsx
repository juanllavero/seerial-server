import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet } from 'react-native'

import ParallaxScrollView from '@/components/ParallaxScrollView'
import { useScale } from '@/hooks/useScale'
import AppText from '@/components/text/AppText'
import { useLocalSearchParams } from 'expo-router'

export default function LibrariesScreen() {
	const { id } = useLocalSearchParams()
	const styles = useExploreScreenStyles()
	const scale = useScale()
	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
			headerImage={
				<Ionicons
					size={310 * scale}
					name='code-slash'
					style={styles.headerImage}
				/>
			}
		>
			<AppText className='text-5xl text-white bg-black'>{id}</AppText>
		</ParallaxScrollView>
	)
}

const useExploreScreenStyles = function () {
	const scale = useScale()
	return StyleSheet.create({
		headerImage: {
			color: '#808080',
			bottom: -90 * scale,
			left: -35 * scale,
			position: 'absolute',
		},
		titleContainer: {
			flexDirection: 'row',
			gap: 8 * scale,
		},
	})
}
