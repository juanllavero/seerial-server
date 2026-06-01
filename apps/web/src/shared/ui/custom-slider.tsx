import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface SliderProps {
  value: number;
  buffered: number;
  onChange: (value: number) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  accentColor?: string;
  showKnob?: boolean;
  className?: string;
}

const CustomSlider: React.FC<SliderProps> = ({
  value,
  buffered,
  onChange,
  onInteractionStart,
  onInteractionEnd,
  accentColor = 'var(--app-color)',
  showKnob = false,
  className = '',
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateValue = (clientX: number) => {
    if (!sliderRef.current) return 0;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    return percentage;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onInteractionStart?.();
    const newValue = calculateValue(e.clientX);
    setTempValue(newValue);
    onChange(newValue);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (isDragging) return;

    setIsHovering(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let nextValue = currentValue;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      nextValue = Math.max(0, currentValue - 1);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      nextValue = Math.min(100, currentValue + 1);
    } else if (event.key === 'Home') {
      nextValue = 0;
    } else if (event.key === 'End') {
      nextValue = 100;
    } else {
      return;
    }

    event.preventDefault();
    onInteractionStart?.();
    setTempValue(nextValue);
    onChange(nextValue);
    onInteractionEnd?.();
  };

  // Event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        const slider = sliderRef.current;
        if (!slider) return;

        const rect = slider.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newValue = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setTempValue(newValue);
        onChange(newValue);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        onInteractionEnd?.();
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, onChange, onInteractionEnd]);

  const currentValue = isDragging ? tempValue : value;

  return (
    <div
      ref={containerRef}
      className={`relative w-full cursor-pointer py-2 ${className}`}
      role="slider"
      tabIndex={0}
      aria-label="Slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(currentValue)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
    >
      {/* Slider Bar */}
      <div
        ref={sliderRef}
        className={`bg-opacity-50 relative h-1 rounded-full bg-gray-700 transition-all duration-200`}
      >
        {/* Buffer Progress */}
        <div
          className="bg-opacity-60 absolute top-0 left-0 h-full rounded-full bg-gray-500 transition-all duration-200"
          style={{ width: `${Math.min(buffered, 100)}%` }}
        />

        {/* Current Progress */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-200"
          style={{
            width: `${Math.min(currentValue, 100)}%`,
            backgroundColor: accentColor,
          }}
        />

        {/* Circle */}
        {(isHovering || isDragging || showKnob) && (
          <div
            className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 transform rounded-full bg-white shadow-lg transition-all duration-200 ${
              isDragging ? 'scale-[1.5]' : 'scale-100'
            }`}
            style={{
              left: `calc(${Math.min(currentValue, 100)}% - 6px)`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CustomSlider;
