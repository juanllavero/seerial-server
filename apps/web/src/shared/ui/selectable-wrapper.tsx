import type { SelectableOption } from '@seerial/domain';
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

  const findUniqueValueByOptionValue = (optionValue?: string) => {
    const option = options.find((currentOption) => currentOption.value === optionValue);
    return option ? getUniqueValue(option) : undefined;
  };

  const handleValueChange = (uniqueValue: string) => {
    const [key, value] = uniqueValue.split('::');
    onValueChange(key, value);
  };

  const defaultUniqueValue = findUniqueValueByOptionValue(defaultValue);

  const controlledValue = findUniqueValueByOptionValue(value);

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
