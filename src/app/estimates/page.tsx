'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import EstimateCard from '@/components/estimates/EstimateCard';
import { Estimate } from '@/types';
import { PlusIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { EstimateService } from '@/lib/estimateService';
import toast from 'react-hot-toast';

// Mock data for now
const mockEstimates: Estimate[] = [];

export default function EstimatesPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Cargar estimados desde Firebase
  useEffect(() => {
    const loadEstimates = async () => {
      if (!profile?.userId) return;
      
      try {
        setLoading(true);
        const userEstimates = await EstimateService.getUserEstimates(profile.userId);
        setEstimates(userEstimates);
      } catch (error) {
        console.error('Error loading estimates:', error);
        toast.error('Error al cargar los estimados');
      } finally {
        setLoading(false);
      }
    };

    loadEstimates();
  }, [profile?.userId]);

  const filteredEstimates = estimates.filter(estimate => {
    const matchesSearch = estimate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         estimate.estimateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         estimate.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || estimate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteEstimate = (estimateId: string) => {
    // Simplemente quitar de la lista local
    setEstimates(prev => prev.filter(estimate => estimate.id !== estimateId));
  };

  const handleRefresh = async () => {
    if (!profile?.userId) return;
    
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing estimates from Firebase...');
      const userEstimates = await EstimateService.getUserEstimates(profile.userId);
      console.log('📋 Firebase estimates count:', userEstimates.length);
      console.log('📋 Firebase estimates IDs:', userEstimates.map(e => e.id));
      setEstimates(userEstimates);
      toast.success(`Lista actualizada: ${userEstimates.length} estimados desde Firebase`);
    } catch (error) {
      console.error('Error refreshing estimates:', error);
      toast.error('Error al actualizar la lista');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando estimados...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('navigation.estimates') || 'Estimados y Presupuestos'}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('estimates.manageEstimates') || 'Gestiona tus presupuestos y estimados de proyectos'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
              <Link
                href="/estimates/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('estimates.newEstimate') || 'Nuevo Estimado'}
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder') || 'Buscar estimados...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">{t('estimates.allStatuses') || 'Todos los estados'}</option>
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviado</option>
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Estimates grid */}
          {filteredEstimates.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay estimados</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'No se encontraron estimados con los filtros aplicados.'
                  : 'Comienza creando tu primer estimado.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <div className="mt-6">
                  <Link
                    href="/estimates/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {t('estimates.newEstimate') || 'Nuevo Estimado'}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEstimates.map((estimate) => (
                <EstimateCard 
                  key={estimate.id} 
                  estimate={estimate}
                  projectName={estimate.projectName}
                  clientName={estimate.clientName}
                  onDelete={handleDeleteEstimate}
                />
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
