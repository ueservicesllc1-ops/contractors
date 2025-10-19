'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import EstimateView from '@/components/estimates/EstimateView';
import { Estimate } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EstimateService } from '@/lib/estimateService';
import { useProfile } from '@/contexts/ProfileContext';

export default function EstimateViewPage() {
  const params = useParams();
  const estimateId = params.id as string;
  const { profile } = useProfile();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar estimado desde Firebase
  useEffect(() => {
    const loadEstimate = async () => {
      if (!profile?.userId) return;
      
      try {
        setLoading(true);
        const userEstimates = await EstimateService.getUserEstimates(profile.userId);
        const foundEstimate = userEstimates.find(est => est.id === estimateId);
        
        if (!foundEstimate) {
          setError('Estimado no encontrado');
          return;
        }
        
        setEstimate(foundEstimate);
      } catch (error) {
        console.error('Error loading estimate:', error);
        setError('Error al cargar el estimado');
      } finally {
        setLoading(false);
      }
    };

    loadEstimate();
  }, [estimateId, profile?.userId]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error || !estimate) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Estimado no encontrado</h1>
            <p className="mt-2 text-gray-600">{error || 'El estimado que buscas no existe o ha sido eliminado.'}</p>
            <Link
              href="/estimates"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver a Estimados
            </Link>
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
          <div className="flex items-center space-x-4">
            <Link
              href="/estimates"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Volver a Estimados
            </Link>
          </div>

          {/* Estimate View */}
          <EstimateView
            estimate={estimate}
            projectName="Casa Residencial Norte"
            clientName="Juan Pérez"
            clientAddress="456 Oak Street, Newark, NJ 07103"
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
