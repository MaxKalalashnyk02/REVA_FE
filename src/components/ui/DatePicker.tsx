import { forwardRef, useState, type MouseEvent } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  label: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
  dateFormat?: string;
  placeholderText?: string;
}

interface CustomInputProps {
  value?: string;
  onClick?: () => void;
  label: string;
  onToggle?: (e: MouseEvent) => void;
}

const CustomInput = forwardRef<HTMLButtonElement, CustomInputProps>(
  ({ value, label, onToggle }, ref) => (
    <label className="flex flex-col text-slate-400 text-sm font-medium">
      {label}
      <button
        type="button"
        onClick={onToggle}
        ref={ref}
        className="mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200 
          text-left flex items-center justify-between gap-2 cursor-pointer
          hover:border-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 
          transition-colors"
      >
        <span className={value ? 'text-slate-200' : 'text-slate-500'}>
          {value || 'Select a date...'}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-cyan-400 flex-shrink-0"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>
    </label>
  )
);

CustomInput.displayName = 'CustomInput';

export function DatePicker({ 
  label, 
  selected, 
  onChange, 
  dateFormat = "d MMMM yyyy",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleClickOutside = () => {
    setIsOpen(false);
  };

  const handleChange = (date: Date | null) => {
    onChange(date);
    setIsOpen(false);
  };

  return (
    <ReactDatePicker
      selected={selected}
      onChange={handleChange}
      dateFormat={dateFormat}
      customInput={<CustomInput label={label} onToggle={handleToggle} />}
      showPopperArrow={false}
      popperClassName="reva-datepicker-popper"
      calendarClassName="reva-datepicker"
      wrapperClassName="w-full"
      showMonthDropdown
      showYearDropdown
      dropdownMode="scroll"
      popperPlacement="bottom-start"
      portalId="root"
      open={isOpen}
      onClickOutside={handleClickOutside}
    />
  );
}

const CustomInputSmall = forwardRef<HTMLButtonElement, CustomInputProps>(
  ({ value, label, onToggle }, ref) => (
    <label className="flex flex-col text-slate-400 text-sm font-medium">
      {label}
      <button
        type="button"
        onClick={onToggle}
        ref={ref}
        className="mt-1 px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-md text-slate-200 
          text-left flex items-center justify-between gap-2 cursor-pointer
          hover:border-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 
          transition-colors"
      >
        <span className={value ? 'text-slate-200' : 'text-slate-500 text-sm'}>
          {value || 'Select a date...'}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-cyan-400 flex-shrink-0"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>
    </label>
  )
);

CustomInputSmall.displayName = 'CustomInputSmall';

export function DatePickerSmall({ 
  label, 
  selected, 
  onChange, 
  dateFormat = "d MMM yyyy",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleClickOutside = () => {
    setIsOpen(false);
  };

  const handleChange = (date: Date | null) => {
    onChange(date);
    setIsOpen(false);
  };

  return (
    <ReactDatePicker
      selected={selected}
      onChange={handleChange}
      dateFormat={dateFormat}
      customInput={<CustomInputSmall label={label} onToggle={handleToggle} />}
      showPopperArrow={false}
      popperClassName="reva-datepicker-popper"
      calendarClassName="reva-datepicker"
      wrapperClassName="w-full"
      showMonthDropdown
      showYearDropdown
      dropdownMode="scroll"
      popperPlacement="bottom-start"
      portalId="root"
      open={isOpen}
      onClickOutside={handleClickOutside}
    />
  );
}
