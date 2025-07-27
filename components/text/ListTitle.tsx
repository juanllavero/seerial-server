import React, { memo } from 'react'
import AppText from './AppText'

interface AppTextProps {
	className?: string
	style?: any
	children: React.ReactNode
}

const ListTitle = ({ className, style, children, ...props }: AppTextProps) => {
	return (
		<AppText
			className={`${className} font-semibold text-[3vh] text-white`}
			style={style}
			{...props}
		>
			{children}
		</AppText>
	)
}

export default memo(ListTitle)
