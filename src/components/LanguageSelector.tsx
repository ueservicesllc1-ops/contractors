'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as 'en' | 'es';
    console.log('🔄 LanguageSelector: Changing language to', newLanguage);
    setLanguage(newLanguage);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <GlobeAltIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <select
          value={language}
          onChange={handleLanguageChange}
          className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-0"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  );
}
