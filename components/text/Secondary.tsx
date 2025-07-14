import React from 'react'
import AppText from './AppText'

interface AppTextProps {
	className?: string
	style?: any
	children: React.ReactNode
}

const Secondary = ({ className, style, children, ...props }: AppTextProps) => {
	return (
		<AppText
			className={`${className} font-medium text-3xl sm:text-xl md:text-2xl lg:text-3xl text-neutral-200`}
			style={style}
			{...props}
		>
			{children}
		</AppText>
	)
}

export default Secondary
