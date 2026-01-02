'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import EstimateForm from '@/components/estimates/EstimateForm';
import { Estimate, Project, Client } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { ProjectService } from '@/lib/projectService';
import { ClientService } from '@/lib/clientService';
import { EstimateService } from '@/lib/estimateService';
import toast from 'react-hot-toast';

export default function EditEstimatePage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const params = useParams();
  const router = useRouter();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      if (!params.id || !profile?.userId) return;
      
      try {
        setLoading(true);
        
        // Cargar estimado
        console.log('Loading estimate with ID from params:', params.id);
        const estimateData = await EstimateService.getEstimate(params.id as string);
        if (!estimateData) {
          toast.error('Estimado no encontrado');
          router.push('/estimates');
          return;
        }
        console.log('Estimate loaded:', estimateData);
        console.log('Estimate ID:', estimateData.id);
        setEstimate(estimateData);

        // Cargar proyectos y clientes
        const [projectsData, clientsData] = await Promise.all([
          ProjectService.getUserProjects(profile.userId),
          ClientService.getUserClients(profile.userId),
        ]);
        setProjects(projectsData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar los datos');
        router.push('/estimates');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id, profile?.userId, router]);

  const handleSubmit = async (updatedEstimate: Estimate) => {
    if (!user || !profile?.userId) {
      toast.error('Debes estar logueado para editar estimados');
      return;
    }

    if (!estimate || !estimate.id) {
      toast.error('Error: No se pudo obtener el ID del estimado');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Usar el ID del estimado cargado, no el del formulario (que puede tener un ID generado)
      const estimateId = estimate.id;
      console.log('Updating estimate with ID:', estimateId);
      console.log('Updated estimate data:', updatedEstimate);
      
      // Actualizar en Firebase usando el ID real del documento
      await EstimateService.updateEstimate(estimateId, updatedEstimate);
      
      console.log('Estimate updated in Firebase:', estimateId);
      toast.success('Estimado actualizado exitosamente');
      router.push('/estimates');
    } catch (error) {
      console.error('Error updating estimate:', error);
      toast.error('Error al actualizar el estimado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/estimates');
  };

  const handleClientCreated = (client: Client) => {
    setClients(prev => [...prev, client]);
    toast.success('Cliente creado exitosamente');
  };

  const handleProjectCreated = (project: Project) => {
    setProjects(prev => [...prev, project]);
    toast.success('Proyecto creado exitosamente');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando estimado...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!estimate) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="space-y-6">
            <div className="text-center py-12">
              <p className="text-gray-600">Estimado no encontrado</p>
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/estimates"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editar Estimado</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {estimate.estimateNumber} - {estimate.name}
                </p>
              </div>
            </div>
          </div>

          {/* Estimate Form */}
          {estimate && (
            <EstimateForm
              initialData={{
                ...estimate,
                id: estimate.id, // Asegurar que el ID real se pase
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              projects={projects}
              clients={clients}
              onClientCreated={handleClientCreated}
              onProjectCreated={handleProjectCreated}
            />
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
