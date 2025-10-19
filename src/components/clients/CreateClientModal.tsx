'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Client } from '@/types';
import { ClientService } from '@/lib/clientService';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import AddressForm from '@/components/forms/AddressForm';

const clientSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Teléfono es requerido'),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: Client) => void;
}

export default function CreateClientModal({ isOpen, onClose, onClientCreated }: CreateClientModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientAddress, setClientAddress] = useState({
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
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const handleAddressChange = (field: string, value: string) => {
    setClientAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const onSubmit = async (data: ClientFormData) => {
    if (!user) {
      toast.error('Debes estar logueado para crear clientes');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: clientAddress.address,
        city: clientAddress.city,
        state: clientAddress.state,
        zipCode: clientAddress.zipCode,
        notes: data.notes,
      };

      const clientId = await ClientService.createClient(user.id, clientData);
      
      const newClient: Client = {
        id: clientId,
        ...clientData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      toast.success('Cliente creado exitosamente');
      onClientCreated(newClient);
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Error al crear el cliente');
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Nuevo Cliente</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Juan Pérez"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="juan@ejemplo.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono *
              </label>
              <input
                type="tel"
                {...register('phone')}
                placeholder="(973) 555-0123"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <AddressForm
            address={clientAddress.address}
            city={clientAddress.city}
            state={clientAddress.state}
            zipCode={clientAddress.zipCode}
            onAddressChange={handleAddressChange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notas
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Notas adicionales sobre el cliente..."
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
              {isSubmitting ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
