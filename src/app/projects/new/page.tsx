'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import FileUpload from '@/components/common/FileUpload';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const projectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido'),
  clientId: z.string().min(1, 'Debe seleccionar un cliente'),
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().min(1, 'El estado es requerido'),
  zipCode: z.string().min(1, 'El código postal es requerido'),
  description: z.string().optional(),
  estimatedCost: z.number().min(0, 'El costo estimado debe ser mayor a 0'),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

// Mock clients data
const mockClients = [
  { id: '1', name: 'Juan Pérez', email: 'juan@email.com' },
  { id: '2', name: 'María González', email: 'maria@email.com' },
  { id: '3', name: 'Carlos Rodríguez', email: 'carlos@email.com' },
];

export default function NewProjectPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{url: string, fileName: string}>>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    
    try {
      // Here you would save to Firebase
      console.log('Project data:', data);
      console.log('Uploaded files:', uploadedFiles);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Proyecto creado exitosamente');
      router.push('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error al crear el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUploaded = (url: string, fileName: string) => {
    setUploadedFiles(prev => [...prev, { url, fileName }]);
  };

  const handleFileRemoved = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file.fileName !== fileName));
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex items-center space-x-4">
            <Link
              href="/projects"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Volver a Proyectos
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Proyecto</h1>
            <p className="mt-1 text-sm text-gray-500">
              Crea un nuevo proyecto de construcción
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Información del Proyecto
                </h3>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Project Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nombre del Proyecto *
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Ej: Casa Residencial Norte"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Client */}
                  <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                      Cliente *
                    </label>
                    <select
                      {...register('clientId')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Seleccionar cliente</option>
                      {mockClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} - {client.email}
                        </option>
                      ))}
                    </select>
                    {errors.clientId && (
                      <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
                    )}
                  </div>

                  {/* Estimated Cost */}
                  <div>
                    <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700">
                      Costo Estimado *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        {...register('estimatedCost', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.estimatedCost && (
                      <p className="mt-1 text-sm text-red-600">{errors.estimatedCost.message}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Dirección *
                    </label>
                    <input
                      {...register('address')}
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Calle, número, colonia"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>

                  {/* City, State, Zip */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      Ciudad *
                    </label>
                    <input
                      {...register('city')}
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Ciudad"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      Estado *
                    </label>
                    <input
                      {...register('state')}
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Estado"
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                      Código Postal *
                    </label>
                    <input
                      {...register('zipCode')}
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="12345"
                    />
                    {errors.zipCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
                    )}
                  </div>

                  {/* Dates */}
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Fecha de Inicio *
                    </label>
                    <input
                      {...register('startDate')}
                      type="date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      Fecha de Fin (Opcional)
                    </label>
                    <input
                      {...register('endDate')}
                      type="date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Descripción detallada del proyecto..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Archivos del Proyecto
                </h3>
                <FileUpload
                  onFileUploaded={handleFileUploaded}
                  onFileRemoved={handleFileRemoved}
                  folder="projects"
                  multiple={true}
                  acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx']}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Link
                href="/projects"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
              </button>
            </div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
