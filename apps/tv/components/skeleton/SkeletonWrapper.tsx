import React, { memo } from 'react'
import Skeleton from './Skeleton'

interface SkeletonWrapperProps {
	isLoading: boolean
	width: number
	height: number
	borderRadius?: number
	children?: React.ReactNode
}

const SkeletonWrapper: React.FC<SkeletonWrapperProps> = ({
	isLoading,
	width,
	height,
	borderRadius = 4,
	children,
}) => {
	if (!isLoading) {
		return <>{children}</>
	}

	return <Skeleton borderRadius={borderRadius} width={width} height={height} />
}

export default memo(SkeletonWrapper)
