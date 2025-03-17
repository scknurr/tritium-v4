import React, { forwardRef } from 'react';
import { Textarea as FlowbiteTextarea } from 'flowbite-react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <FlowbiteTextarea
          ref={ref}
          className={`w-full ${className}`}
          color={error ? 'failure' : undefined}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea; 