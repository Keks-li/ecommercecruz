import React from 'react';

/**
 * MercuryInput
 * White surface, 1px --ash-300 border, 2px --accent focus ring at 25% opacity,
 * labels above, inline helper and error text, 8px radius.
 */
export default function MercuryInput({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helper,
  icon: Icon,
  rightElement,
  disabled = false,
  className = '',
  required = false,
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[13px] font-medium text-[#1B1D22] mb-1.5"
        >
          {label}
          {required && <span className="text-[#C02B2B] ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-[#8B93A1] pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" strokeWidth={1.5} />
          </div>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-9 sm:h-10 bg-white border rounded-[8px] text-[13px] text-[#1B1D22] placeholder:text-[#8B93A1] transition-colors focus:outline-none focus:ring-2 disabled:bg-[#F4F5F7] disabled:text-[#8B93A1] disabled:cursor-not-allowed ${
            Icon ? 'pl-9' : 'pl-3'
          } ${rightElement ? 'pr-9' : 'pr-3'} ${
            error
              ? 'border-[#C02B2B] focus:border-[#C02B2B] focus:ring-[#C02B2B]/20'
              : 'border-[#CDD1D8] focus:border-[#5266EB] focus:ring-[#5266EB]/25'
          }`}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 flex items-center text-[#8B93A1]">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-[12px] text-[#C02B2B] leading-normal">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-[12px] text-[#5F6877] leading-normal">{helper}</p>
      ) : null}
    </div>
  );
}
