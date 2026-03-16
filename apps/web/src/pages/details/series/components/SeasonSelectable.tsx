import type { SelectableOption } from '@seerial/domain';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SeasonSelectableProps {
  placeholder?: string;
  defaultValue: string;
  onValueChange: (key: string, value: string) => void;
  options: SelectableOption[];
}

function SeasonSelectable({
  placeholder = '',
  defaultValue,
  onValueChange,
  options,
}: SeasonSelectableProps) {
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const getUniqueValue = (option: SelectableOption) => `${option.key}::${option.value}`;

  const handleValueChange = (uniqueValue: string) => {
    const [key, value] = uniqueValue.split('::');
    setSelectedSeason(value);
    onValueChange(key, value);
  };

  const defaultUniqueValue = options.find((option) => option.value === defaultValue)
    ? getUniqueValue(options.find((option) => option.value === defaultValue)!)
    : undefined;

  return (
    <Select defaultValue={defaultUniqueValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-fit space-x-2 border-0 pl-0 outline-0" iconSize={5}>
        <span className="text-xl font-semibold" style={{ color: '#ebebeb' }}>
          {selectedSeason ?? defaultValue}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.key} value={getUniqueValue(option)}>
            {option.value} {/* Display only the value as visible text */}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default SeasonSelectable;
