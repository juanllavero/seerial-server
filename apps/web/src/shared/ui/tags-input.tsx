import { X } from 'lucide-react';
import React, { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  width?: string;
}

export default function TagInput({
  value = [],
  onChange,
  placeholder = '',
  disabled = false,
  maxTags,
  width = 'w-auto',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      if (maxTags && value.length >= maxTags) return;

      // Prevent adding duplicate tags
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove the last tag when backspace is pressed and input is empty
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Adjust container height based on content
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.height = 'auto';
    }
  }, []);

  return (
    <div ref={containerRef}>
      <button
        type="button"
        className={`bg-secondary flex min-h-10 flex-wrap items-center gap-2 rounded-md border p-2 ${width}`}
        onClick={handleContainerClick}
      >
        {value.map((tag) => (
          <Badge key={`Tag-${tag}`} variant="outline" className={`bg-background h-7 px-2 text-sm`}>
            {tag}
            {!disabled && (
              <button
                type="button"
                className="focus:ring-ring ml-1 rounded-full outline-none"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only" style={{ cursor: 'pointer' }}>
                  Eliminar etiqueta {tag}
                </span>
              </button>
            )}
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled || (maxTags !== undefined && value.length >= maxTags)}
          className="focus-visible:text-primary min-w-30 flex-1 border-0 bg-transparent p-2 focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </button>
    </div>
  );
}
