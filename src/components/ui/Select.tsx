import React, { forwardRef } from 'react';
import { Select as FlowbiteSelect } from 'flowbite-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, children, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <FlowbiteSelect
          ref={ref}
          className={`w-full ${className}`}
          color={error ? 'failure' : undefined}
          {...props}
        >
          {children}
        </FlowbiteSelect>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select; 