import React, { memo } from 'react'
import AppText from './AppText'

interface AppTextProps {
	className?: string
	style?: any
	children: React.ReactNode
}

const Title = ({ className, style, children, ...props }: AppTextProps) => {
	return (
		<AppText
			className={`${className} font-black text-[7vh] text-white`}
			style={style}
			{...props}
		>
			{children}
		</AppText>
	)
}

export default memo(Title)
