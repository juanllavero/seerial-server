import React, { memo } from 'react'
import AppText from './AppText'

interface AppTextProps {
	className?: string
	style?: any
	noShadow?: boolean
	onTextLayout?: any
	children: React.ReactNode
}

const Tertiary = ({
	className,
	style,
	onTextLayout,
	noShadow,
	children,
	...props
}: AppTextProps) => {
	return (
		<AppText
			className={`${className} font-medium text-[2vh] text-neutral-200`}
			style={style}
			noShadow
			onTextLayout={onTextLayout}
			{...props}
		>
			{children}
		</AppText>
	)
}

export default memo(Tertiary)
