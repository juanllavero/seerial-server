import React, { memo } from 'react'
import { View } from 'react-native'

interface SeriesDetailsProps {
	id: string
	selectedEpisodeId?: string
}

function SeriesDetails({ id, selectedEpisodeId }: SeriesDetailsProps) {
	return <View>Series</View>
}

export default memo(SeriesDetails)
