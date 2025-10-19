'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Project } from '@/types';
import { ProjectService } from '@/lib/projectService';
import { ClientService } from '@/lib/clientService';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types';
import toast from 'react-hot-toast';
import CreateClientModal from '@/components/clients/CreateClientModal';
import AddressForm from '@/components/forms/AddressForm';

const projectSchema = z.object({
  projectNumber: z.string().min(1, 'Número de proyecto es requerido'),
  name: z.string().min(1, 'Nombre del proyecto es requerido'),
  clientId: z.string().min(1, 'Cliente es requerido'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Fecha de inicio es requerida'),
  endDate: z.string().optional(),
  estimatedCost: z.number().min(0, 'Costo estimado debe ser mayor o igual a 0'),
  status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [projectAddress, setProjectAddress] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'planning',
      estimatedCost: 0,
      startDate: new Date().toISOString().split('T')[0],
    }
  });

  // Cargar clientes
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

    if (isOpen) {
      loadClients();
    }
  }, [isOpen, user]);

  const handleAddressChange = (field: string, value: string) => {
    setProjectAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const onSubmit = async (data: ProjectFormData) => {
    if (!user) {
      toast.error('Debes estar logueado para crear proyectos');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
        projectNumber: data.projectNumber,
        name: data.name,
        clientId: data.clientId,
        client: clients.find(c => c.id === data.clientId),
        address: projectAddress.address,
        city: projectAddress.city,
        state: projectAddress.state,
        zipCode: projectAddress.zipCode,
        description: data.description,
        status: data.status,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        estimatedCost: data.estimatedCost,
        actualCost: 0,
        phases: [],
        teamMembers: [],
        files: [],
      };

      const projectId = await ProjectService.createProject(user.id, projectData);
      
      const newProject: Project = {
        id: projectId,
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      toast.success('Proyecto creado exitosamente');
      onProjectCreated(newProject);
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error al crear el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Nuevo Proyecto</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Número de Proyecto *
              </label>
              <input
                type="text"
                {...register('projectNumber')}
                placeholder="PROJ-202412-001"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.projectNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.projectNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre del Proyecto *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="Casa Residencial Norte"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cliente *
            </label>
            <div className="flex gap-2">
              <select
                {...register('clientId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Seleccionar cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCreateClient(true)}
                className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
              >
                + Cliente
              </button>
            </div>
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
            )}
          </div>

          <AddressForm
            address={projectAddress.address}
            city={projectAddress.city}
            state={projectAddress.state}
            zipCode={projectAddress.zipCode}
            onAddressChange={handleAddressChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Fin
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Costo Estimado *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('estimatedCost', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.estimatedCost && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedCost.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                {...register('status')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="planning">Planificación</option>
                <option value="active">Activo</option>
                <option value="on-hold">En Pausa</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Descripción del proyecto..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>

        {/* Modal para crear cliente */}
        {showCreateClient && (
          <CreateClientModal
            isOpen={showCreateClient}
            onClose={() => setShowCreateClient(false)}
            onClientCreated={(client) => {
              setClients(prev => [client, ...prev]);
              setShowCreateClient(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
