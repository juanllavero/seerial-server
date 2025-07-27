import React, { memo } from 'react'
import { View } from 'react-native'

interface MovieDetailsProps {
	id: string
}

function MovieDetails({ id }: MovieDetailsProps) {
	return <View>Movie</View>
}

export default memo(MovieDetails)
