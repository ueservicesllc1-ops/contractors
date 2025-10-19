'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { 
  CogIcon, 
  PhotoIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  BellIcon,
  ShieldCheckIcon,
  StarIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { t } = useLanguage();
  const { profile, isPremium, subscriptionType } = useProfile();
  const [activeTab, setActiveTab] = useState('branding');

  const tabs = [
    { id: 'branding', name: 'Branding', icon: PhotoIcon },
    { id: 'email', name: 'Email', icon: DocumentTextIcon },
    { id: 'financial', name: 'Financiero', icon: CurrencyDollarIcon },
    { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
  ];

  const handleSave = () => {
    toast.success('Configuración guardada exitosamente');
  };

  const handleUpgrade = () => {
    toast.success('Redirigiendo a plan Premium...');
    // TODO: Implement upgrade flow
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex justify-between items-start">
          <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('settings.title') || 'Configuración'}</h1>
            <p className="mt-1 text-sm text-gray-500">
                {t('settings.description') || 'Configura tu perfil y preferencias de la aplicación'}
              </p>
            </div>
            
            {/* Premium Badge */}
            {!isPremium && (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg">
                <StarIcon className="h-5 w-5" />
                <span className="font-medium">Upgrade to Premium</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white shadow rounded-lg">
            {activeTab === 'branding' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Branding & Logo</h3>
                
                {/* Logo Upload */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Logo de la Empresa</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Subir logo</span>
                            <input type="file" className="sr-only" accept="image/*" />
                          </label>
                          <p className="pl-1">o arrastra y suelta</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG hasta 10MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Brand Colors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Colores de la Empresa</label>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Color Primario</label>
                        <input type="color" className="mt-1 block w-full h-10 rounded-md border-gray-300" defaultValue="#3B82F6" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Color Secundario</label>
                        <input type="color" className="mt-1 block w-full h-10 rounded-md border-gray-300" defaultValue="#1E40AF" />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plantilla de Factura</label>
                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <option>Plantilla Clásica</option>
                      <option>Plantilla Moderna</option>
                      <option>Plantilla Minimalista</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Email</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Firma de Email</label>
                    <textarea 
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Atentamente,&#10;{companyName}&#10;{phone}&#10;{email}"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template de Factura</label>
                    <textarea 
                      rows={6}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Estimado cliente,&#10;&#10;Adjunto encontrará la factura #{invoiceNumber} por un total de ${total}.&#10;&#10;Por favor, proceda con el pago según los términos acordados.&#10;&#10;Gracias por su negocio."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template de Recordatorio</label>
                    <textarea 
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Estimado cliente,&#10;&#10;Le recordamos que la factura #{invoiceNumber} está próxima a vencer.&#10;&#10;Fecha de vencimiento: {dueDate}&#10;Monto: ${total}"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración Financiera</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tasa de Impuesto por Defecto (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        defaultValue="6.25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Días de Pago por Defecto</label>
                      <input 
                        type="number" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        defaultValue="30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Términos de Pago</label>
                    <textarea 
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Pago neto 30 días. Se aplicará un cargo del 1.5% mensual por pagos atrasados."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Moneda</label>
                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>MXN ($)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notificaciones</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Recordatorios de Pago</h4>
                      <p className="text-sm text-gray-500">Enviar recordatorios automáticos antes del vencimiento</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Notificaciones por Email</h4>
                      <p className="text-sm text-gray-500">Recibir notificaciones por email sobre actividad importante</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Alertas de Vencimiento</h4>
                      <p className="text-sm text-gray-500">Notificar cuando las facturas estén próximas a vencer</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
              <div className="flex items-center space-x-2">
                {!isPremium && (
                  <button
                    onClick={handleUpgrade}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <StarIcon className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
