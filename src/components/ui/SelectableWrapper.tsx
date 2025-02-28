import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { SelectableOption } from '@/data/interfaces/Utils'

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
  width = 'w-[180px]',
  onValueChange,
  options,
}: SelectableWrapperProps) {
  const [value, setValue] = React.useState<SelectableOption | null>(null)

  const handleValueChange = (value: string) => {
    const selectedOption = options.find((option) => option.value === value)
    if (selectedOption) {
      onValueChange(selectedOption.key, selectedOption.value)
    }
  }

  return (
    <Select defaultValue={defaultValue} onValueChange={handleValueChange}>
      <SelectTrigger className={width}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.key} value={option.value}>
            {option.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default SelectableWrapper
