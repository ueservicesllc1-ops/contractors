'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import EstimateForm from '@/components/estimates/EstimateForm';
import { Estimate, Project, Client } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { ProjectService } from '@/lib/projectService';
import { ClientService } from '@/lib/clientService';
import { EstimateService } from '@/lib/estimateService';
import toast from 'react-hot-toast';

export default function NewEstimatePage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Cargar proyectos y clientes
  useEffect(() => {
    const loadData = async () => {
      if (!profile?.userId) return;
      
      try {
        setLoading(true);
        const [projectsData, clientsData] = await Promise.all([
          ProjectService.getUserProjects(profile.userId),
          ClientService.getUserClients(profile.userId),
        ]);
        setProjects(projectsData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar proyectos y clientes');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile?.userId]);

  const handleSubmit = async (estimate: Estimate) => {
    if (!user || !profile?.userId) {
      toast.error('Debes estar logueado para crear estimados');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Guardar en Firebase
      const estimateId = await EstimateService.createEstimate(estimate, profile.userId);
      
      console.log('Estimate saved to Firebase with ID:', estimateId);
      toast.success('Estimado guardado exitosamente en Firebase');
      router.push('/estimates');
    } catch (error) {
      console.error('Error creating estimate:', error);
      toast.error('Error al guardar el estimado en Firebase');
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
              <p className="mt-2 text-gray-600">Cargando datos...</p>
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
          <div className="flex items-center space-x-4">
            <Link
              href="/estimates"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Volver a Estimados
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Estimado</h1>
            <p className="mt-1 text-sm text-gray-500">
              Crea un nuevo estimado detallado para tu proyecto
            </p>
          </div>

          {/* Estimate Form */}
          <EstimateForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            projects={projects}
            clients={clients}
            onClientCreated={handleClientCreated}
            onProjectCreated={handleProjectCreated}
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
