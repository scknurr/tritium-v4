import React from 'react';
import { Button } from 'flowbite-react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

export function DarkModeToggle() {
  const { isDarkMode, toggle } = useDarkMode();

  return (
    <Button
      size="sm"
      color="gray"
      onClick={toggle}
      className="!p-2"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}