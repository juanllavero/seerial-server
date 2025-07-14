import React from 'react'
import AppText from './AppText'

interface AppTextProps {
	className?: string
	style?: any
	children: React.ReactNode
}

const ListTitle = ({ className, style, children, ...props }: AppTextProps) => {
	return (
		<AppText
			className={`${className} font-semmibold text-4xl sm:text-2xl md:text-3xl lg:text-4xl text-white`}
			style={style}
			{...props}
		>
			{children}
		</AppText>
	)
}

export default ListTitle
