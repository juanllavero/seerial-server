import React, { memo } from 'react'

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
		<span
			className={`${className} font-medium text-[2.5vh] text-neutral-200`}
			style={style}
			{...props}
		>
			{children}
		</span>
	)
}

export default memo(Secondary)
