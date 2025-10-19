'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { CogIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { t } = useLanguage();
  
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('settings.title') || 'Configuración'}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('settings.description') || 'Configura tu perfil y preferencias de la aplicación'}
            </p>
          </div>

          {/* Coming Soon */}
          <div className="text-center py-12">
            <CogIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">{t('settings.comingSoon') || 'Próximamente'}</h3>
            <p className="mt-2 text-sm text-gray-500">
              {t('settings.workingOnIt') || 'Estamos trabajando en la configuración de la aplicación.'}
            </p>
            <div className="mt-6">
              <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white">
                <CogIcon className="h-5 w-5 mr-2" />
                {t('settings.configPanel') || 'Panel de Configuración'}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
