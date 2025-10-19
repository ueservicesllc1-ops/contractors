'use client';

import React, { useState } from 'react';
import { XMarkIcon, StarIcon, SparklesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';

interface TrialHeroModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'free' | 'enterprise' | 'premium';
}

export default function TrialHeroModal({ isOpen, onClose, userType }: TrialHeroModalProps) {
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isOpen || isDismissed) return null;

  const handleClose = () => {
    setIsDismissed(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con blur */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Popup Hero flotante */}
      <div className="relative w-full max-w-md mx-auto">
        {/* Efectos de brillo animados */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-75 animate-pulse"></div>
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 rounded-2xl blur opacity-50 animate-pulse delay-1000"></div>
        
        {/* Contenido principal */}
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header con gradiente espectacular */}
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
            {/* Partículas flotantes */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-bounce"></div>
              <div className="absolute top-8 right-8 w-1 h-1 bg-white/40 rounded-full animate-bounce delay-300"></div>
              <div className="absolute bottom-4 left-8 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce delay-700"></div>
              <div className="absolute bottom-8 right-4 w-1 h-1 bg-white/50 rounded-full animate-bounce delay-500"></div>
            </div>
            
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <SparklesIcon className="w-6 h-6 text-white animate-spin" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                      <StarIcon className="w-2 h-2 text-yellow-800" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {t('trialHero.title') || '¡Versión de Prueba Disponible!'}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {t('trialHero.subtitle') || 'Acceso completo hasta el 15 de noviembre de 2025'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-6">
            {/* Aviso destacado */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200/20 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <RocketLaunchIcon className="w-4 h-4 text-yellow-800" />
                  </div>
                  <div>
                    <h4 className="font-bold text-yellow-800 text-sm">
                      {t('trialHero.trialPeriod') || 'Período de Prueba Gratuito'}
                    </h4>
                    <p className="text-yellow-700 text-xs mt-1">
                      {t('trialHero.trialDescription') || 'Disfruta de todas las funciones premium hasta el 15 de noviembre de 2025. Después de esta fecha, las suscripciones Enterprise tendrán limitaciones.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de la versión de prueba */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="text-center">
                <h4 className="text-lg font-bold text-blue-900 mb-3">
                  🎉 ¡Versión de Prueba Completa Disponible!
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600 mb-1">5</div>
                    <div className="text-gray-600">Proyectos de Ejemplo</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-2xl font-bold text-green-600 mb-1">5</div>
                    <div className="text-gray-600">Clientes de Ejemplo</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-2xl font-bold text-purple-600 mb-1">5</div>
                    <div className="text-gray-600">Facturas Mensuales</div>
                  </div>
                </div>
                <p className="text-blue-700 mt-4 font-medium">
                  Explora todas las funciones con datos realistas hasta el 15 de noviembre de 2025
                </p>
              </div>
            </div>

            {/* Botón de acción */}
            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                {t('trialHero.continueTrial') || '¡Empezar a Explorar!'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}