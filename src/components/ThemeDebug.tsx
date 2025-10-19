'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeDebug() {
  const { theme, toggleTheme } = useTheme();
  const [htmlClasses, setHtmlClasses] = useState<string>('');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setHtmlClasses(document.documentElement.className);
      
      // Observar cambios en las clases del HTML
      const observer = new MutationObserver(() => {
        setHtmlClasses(document.documentElement.className);
      });
      
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-w-sm">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Theme Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Context Theme:</strong> 
          <span className={`ml-2 px-2 py-1 rounded text-xs ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
            {theme}
          </span>
        </div>
        
        <div>
          <strong>HTML Classes:</strong>
          <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {htmlClasses || 'N/A'}
          </code>
        </div>
        
        <div>
          <strong>Has Dark Class:</strong>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${htmlClasses.includes('dark') ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {htmlClasses.includes('dark') ? 'YES' : 'NO'}
          </span>
        </div>
        
        <div>
          <strong>localStorage:</strong>
          <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {typeof window !== 'undefined' ? localStorage.getItem('theme') || 'null' : 'N/A'}
          </code>
        </div>
      </div>
      
      <button 
        onClick={toggleTheme}
        className="mt-3 w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
      >
        Toggle Theme
      </button>
      
      <button 
        onClick={() => {
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark');
            setHtmlClasses(document.documentElement.className);
          }
        }}
        className="mt-2 w-full px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-medium"
      >
        Force Toggle HTML
      </button>
    </div>
  );
}
