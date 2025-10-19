'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeTest() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-4 bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg">
      <h3 className="text-lg font-bold mb-2">Theme Test</h3>
      <p>Current theme: <strong>{theme}</strong></p>
      <p>HTML classes: <code>{typeof document !== 'undefined' ? document.documentElement.className : 'N/A'}</code></p>
      <button 
        onClick={toggleTheme}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Toggle Theme
      </button>
    </div>
  );
}
