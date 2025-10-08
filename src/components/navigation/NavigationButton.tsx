import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { memo } from 'react'
import { Button } from '../ui/button'

interface FocusableButtonProps {
	text?: string
	title?: string
	className?: string
	icon?: React.ReactNode
	children?: React.ReactNode
	disabled?: boolean
	onClick?: (e: React.MouseEvent) => void
	customKey?: string
	transparent?: boolean
}

function FocusableButton({
	text,
	title,
	icon,
	className,
	children,
	disabled,
	onClick,
	customKey,
	transparent = false,
}: FocusableButtonProps) {
	const { ref, focused } = useFocusable({
		onEnterPress: onClick,
		focusKey: customKey,
	})

	return (
		<Button
			ref={ref}
			title={title}
			className={`${className} hover:text-black ${focused ? 'bg-muted-foreground' : transparent ? 'text-white bg-transparent' : ''}`}
			disabled={disabled}
			onClick={onClick}
		>
			{icon}
			{text}
			{children}
		</Button>
	)
}

export default memo(FocusableButton)
