import React from 'react'
import AppText from './AppText'

interface AppTextProps {
	className?: string
	style?: any
	children: React.ReactNode
}

const Title = ({ className, style, children, ...props }: AppTextProps) => {
	return (
		<AppText
			className={`${className} font-black text-6xl sm:text-4xl md:text-5xl lg:text-6xl text-white`}
			style={style}
			{...props}
		>
			{children}
		</AppText>
	)
}

export default Title
