import React, { memo } from 'react'

interface AppTextProps {
	className?: string
	style?: any
	children: React.ReactNode
}

const ListTitle = ({ className, style, children, ...props }: AppTextProps) => {
	return (
		<span
			className={`${className} font-semibold text-[3vh] text-white`}
			style={style}
			{...props}
		>
			{children}
		</span>
	)
}

export default memo(ListTitle)
