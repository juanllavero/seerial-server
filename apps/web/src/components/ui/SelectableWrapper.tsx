import type { SelectableOption } from '@seerial/domain';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface SelectableWrapperProps {
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  width?: string;
  onValueChange: (key: string, value: string) => void;
  options: SelectableOption[];
}

function SelectableWrapper({
  placeholder = '',
  defaultValue,
  value,
  width = 'w-auto',
  onValueChange,
  options,
}: SelectableWrapperProps) {
  const getUniqueValue = (option: SelectableOption) => `${option.key}::${option.value}`;

  const handleValueChange = (uniqueValue: string) => {
    const [key, value] = uniqueValue.split('::');
    onValueChange(key, value);
  };

  const defaultUniqueValue = options.find((option) => option.value === defaultValue)
    ? getUniqueValue(options.find((option) => option.value === defaultValue)!)
    : undefined;

  const controlledValue = options.find((option) => option.value === value)
    ? getUniqueValue(options.find((option) => option.value === value)!)
    : undefined;

  return (
    <Select
      value={controlledValue}
      defaultValue={defaultUniqueValue}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className={width}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.key} value={getUniqueValue(option)}>
            {option.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default SelectableWrapper;
