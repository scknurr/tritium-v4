import React from 'react';
import { TextInput } from 'flowbite-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({ 
  className = '',
  error,
  ...props 
}) => {
  return (
    <div className="w-full">
      <TextInput
        className={`w-full ${className}`}
        {...props}
        color={error ? 'failure' : undefined}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input; 