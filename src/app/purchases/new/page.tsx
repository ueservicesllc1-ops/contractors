'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { ProjectService } from '@/lib/projectService';
import { PurchaseService } from '@/lib/purchaseService';
import { Project } from '@/types';
import toast from 'react-hot-toast';

export default function NewPurchasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Cargar proyectos del usuario
  useEffect(() => {
    const loadProjects = async () => {
      if (!user || !profile?.userId) return;
      
      try {
        setProjectsLoading(true);
        const userProjects = await ProjectService.getUserProjects(profile.userId);
        setProjects(userProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
        toast.error('Error al cargar los proyectos');
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, [user, profile?.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.userId) return;
    
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      
      const purchaseData = {
        userId: profile.userId,
        supplier: formData.get('supplier') as string,
        invoiceNumber: formData.get('invoiceNumber') as string || '',
        purchaseDate: new Date(formData.get('purchaseDate') as string),
        amount: parseFloat(formData.get('amount') as string),
        projectId: formData.get('projectId') as string || '',
        projectName: projects.find(p => p.id === formData.get('projectId'))?.name || '',
        category: formData.get('category') as 'materials' | 'equipment' | 'labor' | 'permits' | 'other',
        description: formData.get('description') as string || '',
      };

      await PurchaseService.createPurchase(purchaseData, profile.userId);
      toast.success('Compra registrada exitosamente');
      router.push('/purchases');
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast.error('Error al registrar la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/purchases"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Volver a Compras
              </Link>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Compra</h1>
            <p className="mt-1 text-sm text-gray-500">
              Registra una nueva compra o gasto del proyecto
            </p>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Información de la Compra</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Nombre del proveedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de Factura
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Número de factura del proveedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha de Compra *
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Monto *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Proyecto
                  </label>
                  <select 
                    name="projectId"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={projectsLoading}
                  >
                    <option value="">
                      {projectsLoading ? 'Cargando proyectos...' : 'Seleccionar proyecto'}
                    </option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Categoría
                  </label>
                  <select name="category" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="">Seleccionar categoría</option>
                    <option value="materials">Materiales</option>
                    <option value="equipment">Equipos</option>
                    <option value="labor">Mano de Obra</option>
                    <option value="permits">Permisos</option>
                    <option value="other">Otros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Descripción detallada de la compra"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href="/purchases"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
