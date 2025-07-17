import React from 'react'
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
			className={`${className} font-medium text-2xl sm:text-lg md:text-xl lg:text-2xl text-neutral-200`}
			style={style}
			noShadow
			onTextLayout={onTextLayout}
			{...props}
		>
			{children}
		</AppText>
	)
}

export default Tertiary
