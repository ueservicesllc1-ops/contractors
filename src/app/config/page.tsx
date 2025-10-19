'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { BuildingOfficeIcon, UserIcon } from '@heroicons/react/24/outline';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ConfigPage() {
  const { user } = useAuth();
  const { isProfileComplete, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'company',
    companyName: '',
    contactName: user?.name || '',
    contactEmail: user?.email || '',
    contactPhone: '',
    address: '',
    city: '',
    state: 'New Jersey',
    zipCode: '',
    country: 'United States'
  });

  // Verificar si el perfil ya está completo
  useEffect(() => {
    if (!profileLoading && isProfileComplete) {
      console.log('Profile already complete, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [isProfileComplete, profileLoading, router]);

  // Actualizar formData cuando el user cambie
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: user.name || '',
        contactEmail: user.email || ''
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      // Guardar datos de empresa en Firestore
      await setDoc(doc(db, 'company_profiles', user.id), {
        ...formData,
        isComplete: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Solo cuando guarde exitosamente, ir al dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving company data:', error);
      alert('Error al guardar los datos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Mostrar loading mientras se verifica el perfil
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BuildingOfficeIcon className="mx-auto h-16 w-16 text-blue-600 animate-pulse" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Verificando configuración...
          </h1>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <BuildingOfficeIcon className="mx-auto h-16 w-16 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 mt-4">Configuración de Empresa</h1>
              <p className="mt-2 text-lg text-gray-600">
                Completa los datos de tu empresa para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de negocio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Negocio
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative">
                    <input
                      type="radio"
                      name="type"
                      value="company"
                      checked={formData.type === 'company'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'company' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <BuildingOfficeIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="text-sm font-semibold text-center">Empresa</h3>
                    </div>
                  </label>
                  
                  <label className="relative">
                    <input
                      type="radio"
                      name="type"
                      value="contractor"
                      checked={formData.type === 'contractor'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'contractor' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <UserIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="text-sm font-semibold text-center">Contratista</h3>
                    </div>
                  </label>
                </div>
              </div>

              {/* Nombre de empresa */}
              {formData.type === 'company' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Mi Empresa LLC"
                  />
                </div>
              )}

              {/* Datos de contacto */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
                  placeholder="juan@empresa.com"
                />
                <p className="mt-1 text-xs text-gray-500">Este email no se puede cambiar</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="(973) 555-0123"
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Newark"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estado *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="New Jersey"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Código Postal *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="07102"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    País
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Botón de envío */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar y Continuar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
