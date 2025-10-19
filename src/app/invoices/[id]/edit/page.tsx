'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Invoice, InvoiceItem, Project, Client } from '@/types';
import { formatCurrency, calculateInvoiceTotals, generateInvoiceNumber } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { InvoiceService } from '@/lib/invoiceService';
import { ProjectService } from '@/lib/projectService';
import { ClientService } from '@/lib/clientService';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import CreateClientModal from '@/components/clients/CreateClientModal';

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Número de factura es requerido'),
  clientId: z.string().min(1, 'Cliente es requerido'),
  projectId: z.string().optional(),
  type: z.enum(['standard', 'progress', 'recurring']),
  issueDate: z.string().min(1, 'Fecha de emisión es requerida'),
  dueDate: z.string().min(1, 'Fecha de vencimiento es requerida'),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, 'Descripción es requerida'),
    quantity: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
    unit: z.string().min(1, 'Unidad es requerida'),
    unitPrice: z.number().min(0, 'Precio unitario debe ser mayor a 0'),
    total: z.number(),
    category: z.string().optional(),
  })).min(1, 'Al menos un item es requerido'),
  subtotal: z.number(),
  taxRate: z.number().min(0).max(100),
  tax: z.number(),
  total: z.number(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  progressPhase: z.string().optional(),
  progressPercentage: z.number().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      clientId: '',
      projectId: '',
      type: 'standard',
      issueDate: '',
      dueDate: '',
      items: [{ id: '1', description: '', quantity: 1, unit: '', unitPrice: 0, total: 0, category: '' }],
      subtotal: 0,
      taxRate: 6.25,
      tax: 0,
      total: 0,
      notes: '',
      terms: '',
      progressPhase: '',
      progressPercentage: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedTaxRate = watch('taxRate');

  // Calcular totales automáticamente
  useEffect(() => {
    if (watchedItems && watchedItems.length > 0) {
      const totals = calculateInvoiceTotals(watchedItems, watchedTaxRate || 0);
      setValue('subtotal', totals.subtotal);
      setValue('tax', totals.tax);
      setValue('total', totals.total);
      
      console.log('Totals recalculated:', {
        items: watchedItems.length,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total
      });
    }
  }, [watchedItems, watchedTaxRate, setValue]);

  // Timeout para evitar carga infinita
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Load timeout reached, forcing load');
        setLoadTimeout(true);
        setLoading(false);
      }
    }, 10000); // 10 segundos timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      if (!params.id || !profile) {
        console.log('Waiting for dependencies:', { paramsId: params.id, userId: profile?.userId, profile: !!profile });
        return;
      }
      
      try {
        setLoading(true);
        
        // Cargar factura
        const invoiceData = await InvoiceService.getInvoice(params.id as string);
        if (!invoiceData) {
          toast.error('Factura no encontrada');
          router.push('/invoices');
          return;
        }
        setInvoice(invoiceData);

        // Cargar proyectos y clientes
        console.log('Loading projects and clients for userId:', profile.userId);
        try {
          const [projectsData, clientsData] = await Promise.all([
            ProjectService.getUserProjects(profile.userId),
            ClientService.getUserClients(profile.userId),
          ]);
          console.log('Projects loaded:', projectsData.length, projectsData);
          console.log('Clients loaded:', clientsData.length, clientsData);
          setProjects(projectsData);
          setClients(clientsData);
        } catch (error) {
          console.error('Error loading projects/clients:', error);
          // Continuar sin proyectos/clientes si hay error
          setProjects([]);
          setClients([]);
        }

        // Cargar datos del formulario usando reset
        console.log('Loading invoice data:', invoiceData);
        console.log('Client ID:', invoiceData.clientId);
        console.log('Project ID:', invoiceData.projectId);
        
        // Mapear tipos de factura
        const mapInvoiceType = (type: string) => {
          switch (type) {
            case 'final':
              return 'standard';
            case 'change_order':
              return 'standard';
            case 'retainer':
              return 'standard';
            default:
              return type as 'progress' | 'standard' | 'recurring';
          }
        };

        const formData = {
          invoiceNumber: invoiceData.invoiceNumber,
          clientId: invoiceData.clientId || '',
          projectId: invoiceData.projectId || '',
          type: mapInvoiceType(invoiceData.type),
          issueDate: invoiceData.issueDate.toISOString().split('T')[0],
          dueDate: invoiceData.dueDate.toISOString().split('T')[0],
          items: invoiceData.items || [],
          taxRate: invoiceData.taxRate || 6.25,
          notes: invoiceData.notes || '',
          terms: invoiceData.terms || '',
          progressPhase: invoiceData.progressBilling?.phase || '',
          progressPercentage: invoiceData.progressBilling?.percentage || 0,
          subtotal: invoiceData.subtotal || 0,
          tax: invoiceData.tax || 0,
          total: invoiceData.total || 0,
        };

        reset(formData);

        // Verificar que los valores se establecieron
        setTimeout(() => {
          console.log('Form values after reset:', {
            clientId: watch('clientId'),
            projectId: watch('projectId'),
            items: watch('items'),
            availableClients: clients.map(c => ({ id: c.id, name: c.name })),
            availableProjects: projects.map(p => ({ id: p.id, name: p.name }))
          });
        }, 200);

      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id, profile, router, setValue]);

  const addItem = () => {
    const newId = (fields.length + 1).toString();
    append({
      id: newId,
      description: '',
      quantity: 1,
      unit: '',
      unitPrice: 0,
      total: 0,
      category: '',
    });
    
    // Recalcular totales después de agregar el item
    setTimeout(() => {
      const currentItems = watch('items');
      const currentTaxRate = watch('taxRate');
      const totals = calculateInvoiceTotals(currentItems, currentTaxRate);
      setValue('subtotal', totals.subtotal);
      setValue('tax', totals.tax);
      setValue('total', totals.total);
    }, 100);
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      
      // Recalcular totales después de eliminar el item
      setTimeout(() => {
        const currentItems = watch('items');
        const currentTaxRate = watch('taxRate');
        const totals = calculateInvoiceTotals(currentItems, currentTaxRate);
        setValue('subtotal', totals.subtotal);
        setValue('tax', totals.tax);
        setValue('total', totals.total);
      }, 100);
    }
  };

  const updateItemTotal = (index: number, quantity: number, unitPrice: number) => {
    const total = quantity * unitPrice;
    setValue(`items.${index}.total`, total);
    
    // Recalcular totales inmediatamente después de actualizar el item
    setTimeout(() => {
      const currentItems = watch('items');
      const currentTaxRate = watch('taxRate');
      const totals = calculateInvoiceTotals(currentItems, currentTaxRate);
      setValue('subtotal', totals.subtotal);
      setValue('tax', totals.tax);
      setValue('total', totals.total);
    }, 100);
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!profile) {
      toast.error('Perfil no disponible');
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedClient = clients.find(c => c.id === data.clientId);
      const selectedProject = projects.find(p => p.id === data.projectId);

      if (!selectedClient) {
        toast.error('Cliente no encontrado');
        return;
      }

      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        clientName: selectedClient.name,
        clientAddress: `${selectedClient.address}, ${selectedClient.city}, ${selectedClient.state} ${selectedClient.zipCode}`,
        clientPhone: selectedClient.phone,
        clientEmail: selectedClient.email,
        projectId: data.projectId || '',
        projectName: selectedProject?.name || '',
        type: (data.type === 'standard' ? 'final' : data.type === 'recurring' ? 'retainer' : data.type) as 'progress' | 'final' | 'change_order' | 'retainer',
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        items: data.items.map(item => ({
          ...item,
          category: (item.category || 'other') as 'materials' | 'equipment' | 'labor' | 'subcontractor' | 'other'
        })),
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        tax: data.tax,
        total: data.total,
        notes: data.notes,
        terms: data.terms,
        status: invoice?.status || 'draft',
        contractorName: profile.companyName || profile.contactName,
        contractorAddress: `${profile.address}, ${profile.city}, ${profile.state} ${profile.zipCode}`,
        contractorPhone: profile.contactPhone,
        contractorEmail: profile.contactEmail,
        contractorLicense: profile.njContractorLicense || '',
        ...(data.type === 'progress' && data.progressPhase && data.progressPercentage ? {
          progressBilling: {
            phase: data.progressPhase,
            percentage: data.progressPercentage,
            amount: data.total
          }
        } : {}),
      };

      await InvoiceService.updateInvoice(params.id as string, invoiceData);
      toast.success('Factura actualizada exitosamente');
      router.push(`/invoices/${params.id}`);
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Error al actualizar la factura');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if ((loading && !loadTimeout) || !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {!profile ? 'Cargando perfil...' : 'Cargando factura...'}
          </p>
          {loadTimeout && (
            <p className="mt-2 text-red-600 text-sm">
              Timeout alcanzado. Cargando datos básicos...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push(`/invoices/${params.id}`)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver a Factura
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Editar Factura</h1>
        <div></div>
      </div>

      {/* Debug Info - Remove in production */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info:</h3>
        <div className="text-xs text-yellow-700 space-y-1">
          <p>Profile loaded: {profile ? '✅' : '❌'}</p>
          <p>Profile userId: {profile?.userId || 'N/A'}</p>
          <p>User from auth: {user?.id || 'N/A'}</p>
          <p>Clients loaded: {clients.length}</p>
          <p>Projects loaded: {projects.length}</p>
          <p>Form clientId: {watch('clientId')}</p>
          <p>Form projectId: {watch('projectId')}</p>
          <p>Form items: {watch('items')?.length || 0}</p>
          <p>Loading state: {loading ? '⏳' : '✅'}</p>
          {clients.length === 0 && (
            <button
              onClick={() => setShowCreateClient(true)}
              className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              Crear Cliente de Prueba
            </button>
          )}
          <button
            onClick={() => {
              const currentItems = watch('items');
              const currentTaxRate = watch('taxRate');
              const totals = calculateInvoiceTotals(currentItems, currentTaxRate);
              setValue('subtotal', totals.subtotal);
              setValue('tax', totals.tax);
              setValue('total', totals.total);
              console.log('Forced recalculation:', totals);
            }}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Recalcular Totales
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Información Básica */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Factura
              </label>
              <input
                {...register('invoiceNumber')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.invoiceNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Factura
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="standard">Estándar</option>
                <option value="progress">Por Progreso</option>
                <option value="recurring">Recurrente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <div className="flex space-x-2">
                <select
                  {...register('clientId')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCreateClient(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proyecto
              </label>
              <div className="flex space-x-2">
                <select
                  {...register('projectId')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCreateProject(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Emisión *
              </label>
              <input
                type="date"
                {...register('issueDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.issueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.issueDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento *
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Item
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    {...register(`items.${index}.description`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción del item"
                  />
                  {errors.items?.[index]?.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.items[index]?.description?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    onChange={(e) => {
                      const quantity = parseFloat(e.target.value) || 0;
                      const unitPrice = watchedItems[index]?.unitPrice || 0;
                      updateItemTotal(index, quantity, unitPrice);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.items[index]?.quantity?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad
                  </label>
                  <input
                    {...register(`items.${index}.unit`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="hr, sq ft, etc."
                  />
                  {errors.items?.[index]?.unit && (
                    <p className="mt-1 text-sm text-red-600">{errors.items[index]?.unit?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Unit.
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    onChange={(e) => {
                      const unitPrice = parseFloat(e.target.value) || 0;
                      const quantity = watchedItems[index]?.quantity || 0;
                      updateItemTotal(index, quantity, unitPrice);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.items?.[index]?.unitPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.items[index]?.unitPrice?.message}</p>
                  )}
                </div>

                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                      {formatCurrency(watchedItems[index]?.total || 0)}
                    </div>
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Totales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasa de Impuesto (%)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('taxRate', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div></div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(watchedItems.reduce((sum, item) => sum + (item.total || 0), 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Impuesto ({watchedTaxRate}%):</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency((watchedItems.reduce((sum, item) => sum + (item.total || 0), 0) * watchedTaxRate) / 100)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(watchedItems.reduce((sum, item) => sum + (item.total || 0), 0) * (1 + watchedTaxRate / 100))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notas y Términos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Notas y Términos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas adicionales..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Términos y Condiciones
              </label>
              <textarea
                {...register('terms')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Términos de pago..."
              />
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push(`/invoices/${params.id}`)}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
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
