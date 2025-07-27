import { ScrollView } from 'react-native'
import AppText from '@/components/text/AppText'
import { memo } from 'react'

function MyListScreen() {
	return (
		<ScrollView>
			<AppText>Focus Demo</AppText>
		</ScrollView>
	)
}

export default memo(MyListScreen)
