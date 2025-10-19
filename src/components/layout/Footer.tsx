'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>© 2025 ContractorApp</span>
            <span>•</span>
            <span>{t('footer.allRightsReserved') || 'Todos los derechos reservados'}</span>
          </div>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <span>{t('footer.version') || 'Versión 1.0.0'}</span>
            <span>•</span>
            <span>{t('footer.poweredBy') || 'Potenciado y diseñado por Freedom Labs 2025'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
