import ContinueWatchingContent from '@/components/continueWatching/ContinueWatchingContent'
import { Page } from '@/components/Page'
import React, { memo } from 'react'

function HomeScreen() {
	return (
		<Page>
			<ContinueWatchingContent />
		</Page>
	)
}

export default memo(HomeScreen)
