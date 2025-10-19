'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { ProjectService } from '@/lib/projectService';
import { ClientService } from '@/lib/clientService';
import { ChangeOrderService } from '@/lib/changeOrderService';
import { Project, Client, ChangeOrderItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function NewChangeOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    projectId: '',
    clientId: '',
    title: '',
    description: '',
    reason: '',
    impactOnSchedule: '',
  });

  const [items, setItems] = useState<ChangeOrderItem[]>([]);

  // Cargar proyectos y clientes
  useEffect(() => {
    const loadData = async () => {
      if (!user || !profile?.userId) return;
      
      try {
        setProjectsLoading(true);
        setClientsLoading(true);
        
        const [userProjects, userClients] = await Promise.all([
          ProjectService.getUserProjects(profile.userId),
          ClientService.getUserClients(profile.userId)
        ]);
        
        setProjects(userProjects);
        setClients(userClients);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setProjectsLoading(false);
        setClientsLoading(false);
      }
    };

    loadData();
  }, [user, profile?.userId]);

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Agregar item
  const addItem = () => {
    const newItem: ChangeOrderItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'unidad',
      unitPrice: 0,
      total: 0,
      type: 'addition',
      category: 'materials',
    };
    setItems(prev => [...prev, newItem]);
  };

  // Actualizar item
  const updateItem = (id: string, field: keyof ChangeOrderItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalcular total si cambió quantity, unitPrice, o type
        if (field === 'quantity' || field === 'unitPrice' || field === 'type') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  // Eliminar item
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Obtener cliente y proyecto seleccionados
  const selectedClient = clients.find(c => c.id === formData.clientId);
  const selectedProject = projects.find(p => p.id === formData.projectId);

  // Calcular totales
  const calculateTotals = () => {
    const changeAmount = items.reduce((sum, item) => sum + item.total, 0);
    const originalAmount = selectedProject?.estimatedCost || 0;
    const newTotalAmount = originalAmount + changeAmount;
    
    return { changeAmount, originalAmount, newTotalAmount };
  };

  const { changeAmount, originalAmount, newTotalAmount } = calculateTotals();

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.userId) return;
    
    setLoading(true);
    
    try {
      const changeOrderData = {
        userId: profile.userId,
        projectId: formData.projectId,
        projectName: selectedProject?.name || '',
        clientId: formData.clientId,
        clientName: selectedClient?.name || '',
        clientEmail: selectedClient?.email || '',
        title: formData.title,
        description: formData.description,
        reason: formData.reason,
        originalAmount: originalAmount,
        changeAmount: changeAmount,
        newTotalAmount: newTotalAmount,
        impactOnSchedule: formData.impactOnSchedule,
        items: items,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      };

      const changeOrderId = await ChangeOrderService.createChangeOrder(changeOrderData, profile.userId);
      
      toast.success('Orden de cambio creada exitosamente');
      router.push('/change-orders');
    } catch (error) {
      console.error('Error creating change order:', error);
      toast.error('Error al crear la orden de cambio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/change-orders"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Volver a Órdenes de Cambio
              </Link>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Orden de Cambio</h1>
            <p className="mt-1 text-sm text-gray-500">
              Crea una orden de cambio para modificar un proyecto existente
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Información General</h3>
              </div>
              
              <div className="px-6 py-4 space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Proyecto *
                    </label>
                    <select
                      name="projectId"
                      value={formData.projectId}
                      onChange={handleInputChange}
                      required
                      disabled={projectsLoading}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                      Cliente *
                    </label>
                    <select
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleInputChange}
                      required
                      disabled={clientsLoading}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">
                        {clientsLoading ? 'Cargando clientes...' : 'Seleccionar cliente'}
                      </option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Título de la Orden de Cambio *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ej: Cambio de material de piso"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Descripción del Cambio *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Describe detalladamente el cambio que se realizará..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Razón del Cambio *
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      required
                      rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Explica por qué es necesario este cambio..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Monto Original del Proyecto
                    </label>
                    <div className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm text-gray-900">
                      {selectedProject ? formatCurrency(selectedProject.estimatedCost) : 'Selecciona un proyecto'}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Este monto se carga automáticamente del proyecto seleccionado
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Impacto en el Cronograma
                    </label>
                    <input
                      type="text"
                      name="impactOnSchedule"
                      value={formData.impactOnSchedule}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ej: +2 semanas, sin impacto, etc."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Items del Cambio</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Agregar Item
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No hay items agregados</p>
                    <p className="text-xs text-gray-400 mt-1">Haz clic en &quot;Agregar Item&quot; para comenzar</p>
                  </div>
                ) : (
                  items.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Descripción
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Descripción del item"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Unidad
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="unidad"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Precio Unitario
                          </label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="w-full inline-flex justify-center items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tipo
                          </label>
                          <select
                            value={item.type}
                            onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="addition">Adición</option>
                            <option value="deletion">Eliminación</option>
                            <option value="modification">Modificación</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Categoría
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="materials">Materiales</option>
                            <option value="equipment">Equipos</option>
                            <option value="labor">Mano de Obra</option>
                            <option value="permits">Permisos</option>
                            <option value="other">Otros</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Total
                          </label>
                          <div className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm text-gray-900">
                            ${item.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Resumen Financiero</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Cálculo automático basado en el proyecto seleccionado
                </p>
              </div>
              
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500">Monto Original del Proyecto</dt>
                    <dd className="text-lg font-semibold text-gray-900">{formatCurrency(originalAmount)}</dd>
                    <p className="text-xs text-gray-500 mt-1">Cargado automáticamente</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-blue-700">Monto Adicional del Cambio</dt>
                    <dd className="text-lg font-semibold text-blue-600">{formatCurrency(changeAmount)}</dd>
                    <p className="text-xs text-blue-500 mt-1">Costo adicional por este cambio</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-green-700">Nuevo Total del Proyecto</dt>
                    <dd className="text-lg font-semibold text-green-600">{formatCurrency(newTotalAmount)}</dd>
                    <p className="text-xs text-green-500 mt-1">Original + Cambio</p>
                  </div>
                </dl>
                
                {changeAmount > 0 && (
                  <div className="mt-4 space-y-4">
                    {/* Monto Adicional Destacado */}
                    <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-blue-900">
                          💰 Monto Adicional del Cambio
                        </h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                          {formatCurrency(changeAmount)}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          Este es el costo adicional que se cobrará por este cambio
                        </p>
                      </div>
                    </div>

                    {/* Impacto en el Proyecto */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-gray-800">
                            Impacto en el Proyecto
                          </h3>
                          <p className="mt-1 text-sm text-gray-700">
                            Si el cliente aprueba este cambio, el costo total del proyecto se actualizará automáticamente de <strong>{formatCurrency(originalAmount)}</strong> a <strong>{formatCurrency(newTotalAmount)}</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Link
                href="/change-orders"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Orden de Cambio'}
              </button>
            </div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
