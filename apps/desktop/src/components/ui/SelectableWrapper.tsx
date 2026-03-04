import { SelectableOption } from '../../data/interfaces/Utils'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './select'

interface SelectableWrapperProps {
	placeholder?: string
	defaultValue: string
	width?: string
	onValueChange: (key: string, value: string) => void
	options: SelectableOption[]
}

function SelectableWrapper({
	placeholder = '',
	defaultValue,
	width = 'w-auto',
	onValueChange,
	options,
}: SelectableWrapperProps) {
	// Create a unique value by combining key and value for the Select
	const getUniqueValue = (option: SelectableOption) =>
		`${option.key}::${option.value}`

	const handleValueChange = (uniqueValue: string) => {
		const [key, value] = uniqueValue.split('::')
		onValueChange(key, value)
	}

	// Find the defaultUniqueValue based on the original defaultValue
	const defaultUniqueValue = options.find(
		(option) => option.value === defaultValue
	)
		? getUniqueValue(options.find((option) => option.value === defaultValue)!)
		: undefined

	return (
		<Select
			defaultValue={defaultUniqueValue}
			onValueChange={handleValueChange}
		>
			<SelectTrigger className={width}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem key={option.key} value={getUniqueValue(option)}>
						{option.value} {/* Display only the value as visible text */}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

export default SelectableWrapper
