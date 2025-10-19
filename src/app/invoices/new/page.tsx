'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Invoice, InvoiceItem, Project, Client } from '@/types';
import { generateInvoiceNumber, calculateInvoiceTotals, formatCurrency } from '@/lib/utils';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { InvoiceService } from '@/lib/invoiceService';
import { ProjectService } from '@/lib/projectService';
import { ClientService } from '@/lib/clientService';
import { PlusIcon, TrashIcon, CalculatorIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import CreateClientModal from '@/components/clients/CreateClientModal';
import CreateProjectModal from '@/components/projects/CreateProjectModal';

const invoiceSchema = z.object({
  projectId: z.string().min(1, 'Proyecto es requerido'),
  clientId: z.string().min(1, 'Cliente es requerido'),
  type: z.enum(['progress', 'final', 'change_order', 'retainer']),
  issueDate: z.string().min(1, 'Fecha de emisión es requerida'),
  dueDate: z.string().min(1, 'Fecha de vencimiento es requerida'),
  paymentTerms: z.string().min(1, 'Términos de pago son requeridos'),
  taxRate: z.number().min(0).max(100),
  items: z.array(z.object({
    description: z.string().min(1, 'Descripción es requerida'),
    quantity: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
    unit: z.string().min(1, 'Unidad es requerida'),
    unitPrice: z.number().min(0, 'Precio unitario debe ser mayor o igual a 0'),
    category: z.enum(['labor', 'materials', 'equipment', 'subcontractor', 'other'])
  })).min(1, 'Debe tener al menos un artículo'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  // Progress billing fields
  progressPhase: z.string().optional(),
  progressPercentage: z.number().min(0).max(100).optional()
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;


export default function NewInvoicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      projectId: '',
      clientId: '',
      type: 'progress',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      paymentTerms: 'Net 30 days',
      taxRate: 6.625,
      items: [
        {
          description: '',
          quantity: 1,
          unit: 'item',
          unitPrice: 0,
          category: 'labor'
        }
      ],
      progressPhase: '',
      progressPercentage: 0
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedType = watch('type');
  const watchedTaxRate = watch('taxRate');

  const totals = calculateInvoiceTotals(watchedItems, watchedTaxRate);

  // Cargar proyectos y clientes
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [userProjects, userClients] = await Promise.all([
          ProjectService.getUserProjects(user.id),
          ClientService.getUserClients(user.id)
        ]);
        
        setProjects(userProjects);
        setClients(userClients);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar proyectos y clientes');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setShowCreateProject(false);
    toast.success('Proyecto creado exitosamente');
  };

  const handleClientCreated = (newClient: Client) => {
    setClients(prev => [newClient, ...prev]);
    setShowCreateClient(false);
    toast.success('Cliente creado exitosamente');
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!user) {
      toast.error('Debes estar logueado para crear facturas');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
        projectId: data.projectId,
        invoiceNumber: generateInvoiceNumber(),
        clientId: data.clientId,
        status: 'draft',
        type: data.type,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        paymentTerms: data.paymentTerms,
        items: data.items.map((item, index) => ({
          id: index.toString(),
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          category: item.category
        })),
        subtotal: totals.subtotal,
        tax: totals.tax,
        taxRate: data.taxRate,
        total: totals.total,
        ...(data.type === 'progress' && data.progressPhase && data.progressPercentage ? {
          progressBilling: {
            phase: data.progressPhase,
            percentage: data.progressPercentage,
            amount: totals.total
          }
        } : {}),
        payments: [],
        amountPaid: 0,
        balance: totals.total,
        clientName: clients.find(c => c.id === data.clientId)?.name || '',
        clientAddress: clients.find(c => c.id === data.clientId) ? 
          `${clients.find(c => c.id === data.clientId)?.address}, ${clients.find(c => c.id === data.clientId)?.city}, ${clients.find(c => c.id === data.clientId)?.state} ${clients.find(c => c.id === data.clientId)?.zipCode}` : '',
        clientEmail: clients.find(c => c.id === data.clientId)?.email || '',
        clientPhone: clients.find(c => c.id === data.clientId)?.phone || '',
        contractorName: profile?.companyName || profile?.contactName || 'Mi Empresa',
        contractorAddress: profile ? `${profile.address}, ${profile.city}, ${profile.state} ${profile.zipCode}` : '',
        contractorPhone: profile?.contactPhone || '',
        contractorEmail: profile?.contactEmail || '',
        contractorLicense: profile?.njContractorLicense || '',
        notes: data.notes,
        terms: data.terms,
      };

      // Guardar en Firestore
      const invoiceId = await InvoiceService.createInvoice(user.id, invoiceData);
      
      toast.success('Factura creada exitosamente');
      
      // Redirect to invoice detail page
      router.push(`/invoices/${invoiceId}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Error al crear la factura');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    append({
      description: '',
      quantity: 1,
      unit: 'item',
      unitPrice: 0,
      category: 'labor'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando proyectos y clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Factura</h1>
        <p className="text-gray-600">Crea una nueva factura para tu proyecto</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Información Básica</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Proyecto *
                </label>
                <div className="flex gap-2">
                  <select
                    {...register('projectId')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Seleccionar proyecto</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name} - {project.client?.name || 'Sin cliente'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCreateProject(true)}
                    className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    + Proyecto
                  </button>
                </div>
                {errors.projectId && (
                  <p className="mt-1 text-sm text-red-600">{errors.projectId.message}</p>
                )}
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Factura *
                </label>
                <select
                  {...register('type')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="progress">Progreso</option>
                  <option value="final">Final</option>
                  <option value="change_order">Orden de Cambio</option>
                  <option value="retainer">Anticipo</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Emisión *
                </label>
                <input
                  type="date"
                  {...register('issueDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.issueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.issueDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Términos de Pago *
                </label>
                <input
                  type="text"
                  {...register('paymentTerms')}
                  placeholder="Net 30 days"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.paymentTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentTerms.message}</p>
                )}
              </div>
            </div>

            {/* Progress Billing Fields */}
            {watchedType === 'progress' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fase del Proyecto
                  </label>
                  <input
                    type="text"
                    {...register('progressPhase')}
                    placeholder="Ej: Foundation, Framing, etc."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Porcentaje Completado (%)
                  </label>
                  <input
                    type="number"
                    {...register('progressPercentage', { valueAsNumber: true })}
                    min="0"
                    max="100"
                    placeholder="30"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Artículos de la Factura</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Descripción *
                    </label>
                    <input
                      type="text"
                      {...register(`items.${index}.description`)}
                      placeholder="Descripción del trabajo/material"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.items[index]?.description?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.items[index]?.quantity?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unidad *
                    </label>
                    <input
                      type="text"
                      {...register(`items.${index}.unit`)}
                      placeholder="hr, sq ft, etc."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {errors.items?.[index]?.unit && (
                      <p className="mt-1 text-sm text-red-600">{errors.items[index]?.unit?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Precio Unitario *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {errors.items?.[index]?.unitPrice && (
                      <p className="mt-1 text-sm text-red-600">{errors.items[index]?.unitPrice?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Categoría
                    </label>
                    <select
                      {...register(`items.${index}.category`)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="labor">Mano de Obra</option>
                      <option value="materials">Materiales</option>
                      <option value="equipment">Equipo</option>
                      <option value="subcontractor">Subcontratista</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                      disabled={fields.length === 1}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Agregar Artículo
              </button>
            </div>
          </div>
        </div>

        {/* Tax and Totals */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Impuestos y Totales</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tasa de Impuesto (%)
                </label>
                <input
                  type="number"
                  step="0.001"
                  {...register('taxRate', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.taxRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.taxRate.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Impuesto ({totals.taxRate}%):</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2">
                  <span className="text-base font-semibold text-gray-900">Total:</span>
                  <span className="text-base font-semibold text-gray-900">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Información Adicional</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notas
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Notas adicionales para la factura..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Términos y Condiciones
              </label>
              <textarea
                {...register('terms')}
                rows={3}
                placeholder="Términos y condiciones del pago..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/invoices')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a Facturas
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Crear Factura'}
          </button>
        </div>
      </form>

      {/* Modales */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onProjectCreated={handleProjectCreated}
      />

      <CreateClientModal
        isOpen={showCreateClient}
        onClose={() => setShowCreateClient(false)}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}
