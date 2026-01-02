'use client';

import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { ClientService } from '@/lib/clientService';
import { ProjectService } from '@/lib/projectService';
import { Client } from '@/types';

const projectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido'),
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
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

export default function NewProjectPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string, fileName: string }>>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [clientInputValue, setClientInputValue] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const watchedClientName = watch('clientName');

  // Cargar clientes de Firestore
  useEffect(() => {
    const loadClients = async () => {
      if (!user) return;

      try {
        const userClients = await ClientService.getUserClients(user.id);
        setClients(userClients);
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };

    loadClients();
  }, [user]);

  // Filtrar sugerencias de clientes basado en el input
  useEffect(() => {
    if (clientInputValue.trim().length > 0) {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(clientInputValue.toLowerCase())
      );
      setClientSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setClientSuggestions([]);
      setShowSuggestions(false);
    }
  }, [clientInputValue, clients]);

  // Sincronizar el valor del input con el formulario
  useEffect(() => {
    setValue('clientName', clientInputValue);
  }, [clientInputValue, setValue]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.client-input-container')) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSuggestions]);

  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClientInputValue(value);
    setValue('clientName', value);
  };

  const handleSelectClient = (client: Client) => {
    setClientInputValue(client.name);
    setValue('clientName', client.name);
    setShowSuggestions(false);
  };

  const onSubmit = async (data: ProjectFormData) => {
    if (!user) {
      toast.error('Debes estar logueado para crear proyectos');
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar si el cliente ya existe
      let clientId: string;
      const existingClient = clients.find(c => c.name.toLowerCase() === data.clientName.toLowerCase());

      if (existingClient) {
        // Usar el cliente existente
        clientId = existingClient.id;
      } else {
        // Crear un nuevo cliente con solo el nombre
        const newClientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
          name: data.clientName,
          email: '', // Email vacío, se puede completar después
          phone: '', // Teléfono vacío, se puede completar después
          address: '',
          city: '',
          state: '',
          zipCode: '',
        };

        clientId = await ClientService.createClient(user.id, newClientData);
        toast.success(`Cliente "${data.clientName}" creado automáticamente`);
      }

      // Crear el proyecto
      const projectNumber = `PRJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const projectData = {
        name: data.name,
        projectNumber,
        clientId: clientId,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        description: data.description || '',
        status: 'planning' as const,
        estimatedCost: data.estimatedCost,
        actualCost: 0,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        phases: [],
        teamMembers: [],
        files: uploadedFiles.map(f => {
          // Determinar el tipo de archivo basado en la extensión o nombre
          const lowerName = f.fileName.toLowerCase();
          let type: 'image' | 'document' | 'drawing' | 'other' = 'other';

          if (lowerName.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
            type = 'image';
          } else if (lowerName.match(/\.(pdf|doc|docx|xls|xlsx|txt)$/)) {
            type = 'document';
          }

          return {
            id: f.fileName,
            name: f.fileName,
            url: f.url,
            type,
            uploadedBy: user.id,
            uploadedAt: new Date(),
          };
        }),
      };

      await ProjectService.createProject(user.id, projectData);

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
                  <div className="sm:col-span-2 relative client-input-container">
                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                      Cliente *
                    </label>
                    <div className="relative">
                      <input
                        {...register('clientName')}
                        type="text"
                        value={clientInputValue}
                        onChange={handleClientInputChange}
                        onFocus={() => {
                          if (clientSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Escribe el nombre del cliente o selecciona uno existente"
                        autoComplete="off"
                      />
                      {showSuggestions && clientSuggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {clientSuggestions.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => handleSelectClient(client)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{client.name}</div>
                              {client.email && (
                                <div className="text-sm text-gray-500">{client.email}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Escribe el nombre del cliente. Si no existe, se creará automáticamente en Firestore.
                    </p>
                    {errors.clientName && (
                      <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>
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
