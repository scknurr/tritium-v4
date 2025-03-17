import React from 'react';
import { Label as FlowbiteLabel } from 'flowbite-react';

interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ 
  htmlFor,
  children,
  className = '',
  ...props 
}) => {
  return (
    <FlowbiteLabel
      htmlFor={htmlFor}
      className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
      {...props}
    >
      {children}
    </FlowbiteLabel>
  );
};

export default Label; 