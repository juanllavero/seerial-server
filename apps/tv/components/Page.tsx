import { Direction } from '@bam.tech/lrud'
import { useIsFocused } from '@react-navigation/native'
import { ReactNode, useCallback, useEffect } from 'react'
import {
	SpatialNavigationRoot,
	useLockSpatialNavigation,
} from 'react-tv-space-navigation'
import { Keyboard } from 'react-native'
import { shallow } from 'zustand/shallow'
import useDataStore from '@/context/data.context'

type Props = { children: ReactNode }

/**
 * Locks/unlocks the navigator when the native keyboard is shown/hidden.
 * Allows for the native focus to take over when the keyboard is open,
 * and to go back to our own system when the keyboard is closed.
 */
const SpatialNavigationKeyboardLocker = () => {
	const lockActions = useLockSpatialNavigation()
	useEffect(() => {
		const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
			lockActions.lock()
		})
		const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
			lockActions.unlock()
		})

		return () => {
			showSubscription.remove()
			hideSubscription.remove()
		}
	}, [lockActions])

	return null
}

export const Page = ({ children }: Props) => {
	const isFocused = useIsFocused()
	const { sidebarOpen, setSidebarOpen } = useDataStore(
		(state) => ({
			sidebarOpen: state.sidebarOpen,
			setSidebarOpen: state.setSidebarOpen,
		}),
		shallow
	)

	const isActive = isFocused && !sidebarOpen

	const onDirectionHandledWithoutMovement = useCallback(
		(movement: Direction) => {
			if (movement === 'left') {
				setSidebarOpen(true)
			}
		},
		[sidebarOpen]
	)

	return (
		<SpatialNavigationRoot
			isActive={isActive}
			onDirectionHandledWithoutMovement={onDirectionHandledWithoutMovement}
		>
			{/* <GoBackConfiguration /> */}
			<SpatialNavigationKeyboardLocker />
			{children}
		</SpatialNavigationRoot>
	)
}
