import {
	StyleSheet,
	Text,
	View,
	TVFocusGuideView,
	useTVEventHandler,
	Pressable,
	TouchableHighlight,
	TouchableOpacity,
	FocusEvent,
	BlurEvent,
	PressableProps,
	FlatList,
	ScrollView,
} from 'react-native'
import { useState } from 'react'
import { useThemeColor } from '@/hooks/useThemeColor'
import AppText from './text/AppText'

export function EventHandlingDemo() {
	const [remoteEventLog, setRemoteEventLog] = useState<string[]>([])
	const [pressableEventLog, setPressableEventLog] = useState<string[]>([])

	const logWithAppendedEntry = (log: string[], entry: string) => {
		const limit = 50
		const newEventLog = log.slice(log.length === limit ? 1 : 0, limit)
		newEventLog.push(entry)
		return newEventLog
	}

	const updatePressableLog = (entry: string) => {
		setPressableEventLog((log) => logWithAppendedEntry(log, entry))
	}

	useTVEventHandler((event) => {
		const { eventType, eventKeyAction } = event
		if (eventType !== 'focus' && eventType !== 'blur') {
			setRemoteEventLog((log) =>
				logWithAppendedEntry(
					log,
					`type=${eventType}, action=${
						eventKeyAction !== undefined ? eventKeyAction : ''
					}`
				)
			)
		}
	})

	const styles = useDemoStyles()

	return (
		<TVFocusGuideView>
			<View style={styles.container}>
				<View style={styles.logContainer}>
					<ScrollView horizontal>
						<View>
							<AppText>Remote control events</AppText>
							<FlatList
								contentContainerStyle={styles.logText}
								data={remoteEventLog}
								renderItem={({ item }) => (
									<AppText style={styles.logText}>{item}</AppText>
								)}
							/>
						</View>
					</ScrollView>
					<ScrollView horizontal>
						<View>
							<AppText>Native focus/blur/press events</AppText>
							<FlatList
								contentContainerStyle={styles.logText}
								data={pressableEventLog}
								renderItem={({ item }) => (
									<AppText style={styles.logText}>{item}</AppText>
								)}
							/>
						</View>
					</ScrollView>
				</View>
				<View
					style={styles.buttonsContainer}
					onFocus={(event: any) => {
						updatePressableLog(`Bubbled focus event from ${event.title}`)
					}}
					onBlur={(event: any) => {
						updatePressableLog(`Bubbled blur event from ${event.title}`)
					}}
				>
					<AppText>View receives bubbled focus/blur events</AppText>
					<PressableButton title='Pressable 1' log={updatePressableLog} />
					<PressableButton title='Pressable 2' log={updatePressableLog} />
					<PressableButton
						title='Pressable 3 no bubbling'
						log={updatePressableLog}
						disableFocusAndBlurEventBubbling
					/>
					<TouchableOpacityButton
						title='TouchableOpacity'
						log={updatePressableLog}
					/>
					<TouchableHighlightButton
						title='TouchableHighlight'
						log={updatePressableLog}
					/>
				</View>
			</View>
		</TVFocusGuideView>
	)
}

type ButtonEvent = (FocusEvent | BlurEvent) & { title?: string }

type ButtonProps = {
	title: string
	log: (entry: string) => void
	disableFocusAndBlurEventBubbling?: boolean
}

const handleFocusOrBlur = (
	event: ButtonEvent,
	props: ButtonProps,
	type: string
) => {
	event.title = props.title // Attach info to the event before it bubbles up
	props.log(`${props.title} ${type}`) // Log the event
	if (props.disableFocusAndBlurEventBubbling) {
		event.stopPropagation()
	}
}

const PressableButton = (props: PressableProps & ButtonProps) => {
	const styles = useDemoStyles()

	return (
		<Pressable
			onFocus={(event) => handleFocusOrBlur(event, props, 'focus')}
			onBlur={(event) => handleFocusOrBlur(event, props, 'blur')}
			onPress={() => props.log(`${props.title} press`)}
			onPressIn={() => props.log(`${props.title} pressIn`)}
			onPressOut={() => props.log(`${props.title} pressOut`)}
			onLongPress={() => props.log(`${props.title} longPress`)}
			style={({ pressed, focused }) =>
				pressed || focused ? styles.pressableFocused : styles.pressable
			}
			{...props}
		>
			{({ focused, pressed }) => {
				return (
					<AppText style={styles.pressableText}>
						{pressed
							? `${props.title} pressed`
							: focused
								? `${props.title} focused`
								: props.title}
					</AppText>
				)
			}}
		</Pressable>
	)
}

const TouchableOpacityButton = (props: ButtonProps) => {
	const styles = useDemoStyles()
	const [focused, setFocused] = useState(false)
	const [pressed, setPressed] = useState(false)

	return (
		<TouchableOpacity
			activeOpacity={0.6}
			style={styles.pressable}
			onFocus={(event) => {
				handleFocusOrBlur(event, props, 'focus')
				setFocused(true)
			}}
			onBlur={(event) => {
				handleFocusOrBlur(event, props, 'blur')
				setFocused(false)
			}}
			onPress={() => props.log(`${props.title} press`)}
			onPressIn={() => {
				props.log(`${props.title} pressIn`)
				setPressed(true)
			}}
			onPressOut={() => {
				props.log(`${props.title} pressOut`)
				setPressed(false)
			}}
			onLongPress={() => props.log(`${props.title} longPress`)}
		>
			<Text style={styles.pressableText}>{`${props.title}${
				pressed ? ' pressed' : focused ? ' focused' : ''
			}`}</Text>
		</TouchableOpacity>
	)
}

const TouchableHighlightButton = (props: ButtonProps) => {
	const styles = useDemoStyles()
	const underlayColor = useThemeColor({}, 'tint')
	const [focused, setFocused] = useState(false)
	const [pressed, setPressed] = useState(false)
	return (
		<TouchableHighlight
			style={styles.pressable}
			underlayColor={underlayColor}
			onFocus={(event) => {
				handleFocusOrBlur(event, props, 'focus')
				setFocused(true)
			}}
			onBlur={(event) => {
				handleFocusOrBlur(event, props, 'blur')
				setFocused(false)
			}}
			onPress={() => props.log(`${props.title} press`)}
			onPressIn={() => {
				props.log(`${props.title} pressIn`)
				setPressed(true)
			}}
			onPressOut={() => {
				props.log(`${props.title} pressOut`)
				setPressed(false)
			}}
			onLongPress={() => props.log(`${props.title} longPress`)}
		>
			<Text style={styles.pressableText}>{`${props.title}${
				pressed ? ' pressed' : focused ? ' focused' : ''
			}`}</Text>
		</TouchableHighlight>
	)
}

const useDemoStyles = function () {
	const highlightColor = useThemeColor({}, 'link')
	const backgroundColor = useThemeColor({}, 'background')
	const tintColor = useThemeColor({}, 'tint')
	const textColor = useThemeColor({}, 'text')
	return StyleSheet.create({
		container: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'flex-start',
			justifyContent: 'flex-start',
		},
		buttonsContainer: {
			flex: 3,
			justifyContent: 'flex-start',
			alignItems: 'center',
			backgroundColor: 'black',
		},
		logContainer: {
			flex: 3,
			flexDirection: 'row',
			alignItems: 'flex-start',
			justifyContent: 'flex-start',
		},
		logText: {
			alignItems: 'flex-end',
			justifyContent: 'flex-end',
		},
		pressable: {
			borderColor: highlightColor,
			backgroundColor: textColor,
			borderWidth: 1,
		},
		pressableFocused: {
			borderColor: highlightColor,
			backgroundColor: tintColor,
			borderWidth: 1,
		},
		pressableText: {
			color: backgroundColor,
		},
	})
}
