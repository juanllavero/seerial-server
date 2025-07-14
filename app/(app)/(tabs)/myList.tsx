import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet } from 'react-native'

import ParallaxScrollView from '@/components/ParallaxScrollView'
import { useScale } from '@/hooks/useScale'
import AppText from '@/components/text/AppText'

export default function MyListScreen() {
	const styles = useFocusDemoScreenStyles()
	const scale = useScale()
	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
			headerImage={
				<Ionicons
					size={310 * scale}
					name='tv-outline'
					style={styles.headerImage}
				/>
			}
		>
			<AppText>Focus Demo</AppText>
		</ParallaxScrollView>
	)
}

const useFocusDemoScreenStyles = function () {
	const scale = useScale()
	return StyleSheet.create({
		headerImage: {
			color: '#808080',
			bottom: -45 * scale,
			left: 0,
			position: 'absolute',
		},
		titleContainer: {
			flexDirection: 'row',
			gap: 8 * scale,
		},
	})
}
