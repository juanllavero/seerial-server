import React, { memo } from 'react'
import AppText from './AppText'

interface AppTextProps {
	className?: string
	style?: any
	children: React.ReactNode
}

const Subtitle = ({ className, style, children, ...props }: AppTextProps) => {
	return (
		<AppText
			className={`${className} font-black text-[5vh] pb-5 text-neutral-200`}
			style={style}
			{...props}
		>
			{children}
		</AppText>
	)
}

export default memo(Subtitle)
