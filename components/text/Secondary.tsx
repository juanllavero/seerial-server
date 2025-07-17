import React from 'react'
import AppText from './AppText'

interface AppTextProps {
	className?: string
	style?: any
	noShadow?: boolean
	children: React.ReactNode
}

const Secondary = ({
	className,
	style,
	noShadow,
	children,
	...props
}: AppTextProps) => {
	return (
		<AppText
			className={`${className} font-medium text-3xl sm:text-xl md:text-2xl lg:text-3xl text-neutral-200`}
			style={style}
			noShadow
			{...props}
		>
			{children}
		</AppText>
	)
}

export default Secondary
