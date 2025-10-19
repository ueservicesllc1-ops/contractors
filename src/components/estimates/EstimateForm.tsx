'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Estimate, EstimateSection, EstimateItem } from '@/types';
import { formatCurrency, generateEstimateNumber } from '@/lib/utils';
import { PlusIcon, TrashIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import CreateClientModal from '@/components/clients/CreateClientModal';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';

const estimateSchema = z.object({
  name: z.string().min(1, 'El nombre del estimado es requerido'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Debe seleccionar un proyecto'),
  clientId: z.string().min(1, 'Debe seleccionar un cliente'),
  validUntil: z.string().min(1, 'La fecha de vencimiento es requerida'),
  taxRate: z.number().min(0).max(100),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

type EstimateFormData = z.infer<typeof estimateSchema>;

interface EstimateFormProps {
  initialData?: Partial<Estimate>;
  onSubmit: (estimate: Estimate) => void;
  onCancel: () => void;
  projects: Array<{ id: string; name: string; projectNumber?: string; client?: { name: string } }>;
  clients: Array<{ id: string; name: string }>;
  onClientCreated?: (client: any) => void;
  onProjectCreated?: (project: any) => void;
}

const defaultSections: EstimateSection[] = [];

const categoryOptions = [
  { value: 'materials', label: 'Materiales', icon: '🔨' },
  { value: 'equipment', label: 'Equipos', icon: '🚜' },
  { value: 'labor', label: 'Mano de Obra', icon: '👷' },
];

const unitOptions = [
  'unidad', 'm²', 'm³', 'metro lineal', 'hora', 'día', 'semana', 'mes', 'kg', 'tonelada', 'litro', 'pieza', 'juego', 'set'
];

export default function EstimateForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  projects, 
  clients,
  onClientCreated,
  onProjectCreated
}: EstimateFormProps) {
  const { profile } = useProfile();
  const { t } = useLanguage();
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EstimateFormData>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      projectId: initialData?.projectId || '',
      clientId: initialData?.clientId || '',
      validUntil: initialData?.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '',
      taxRate: initialData?.taxRate ?? 6.25,
      terms: initialData?.terms || 'Net 30 days',
      notes: initialData?.notes || '',
    },
  });

  const taxRate = watch('taxRate') ?? 6.25;

  // Calculate totals whenever items change
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const newTax = (newSubtotal * taxRate) / 100;
    const newTotal = newSubtotal + newTax;


    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
  }, [items, taxRate]);

  const addItem = () => {
    const newItem: EstimateItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unit: 'unidad',
      unitPrice: 0,
      total: 0,
      category: 'materials',
      margin: 0,
    };

    setItems(prevItems => [...prevItems, newItem]);
  };

  const removeItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateItem = (itemId: string, updates: Partial<EstimateItem>) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, ...updates, total: (updates.quantity || item.quantity) * (updates.unitPrice || item.unitPrice) }
          : item
      )
    );
  };

  const onFormSubmit = (data: EstimateFormData) => {
    // Organizar items por categoría en secciones
    const sections: EstimateSection[] = [
      {
        id: '1',
        name: 'Materiales',
        description: 'Materiales de construcción y suministros',
        items: items.filter(item => item.category === 'materials'),
        subtotal: items.filter(item => item.category === 'materials').reduce((sum, item) => sum + item.total, 0),
        order: 1,
      },
      {
        id: '2',
        name: 'Equipos',
        description: 'Alquiler de equipos y herramientas',
        items: items.filter(item => item.category === 'equipment'),
        subtotal: items.filter(item => item.category === 'equipment').reduce((sum, item) => sum + item.total, 0),
        order: 2,
      },
      {
        id: '3',
        name: 'Mano de Obra',
        description: 'Costos de mano de obra especializada y general',
        items: items.filter(item => item.category === 'labor'),
        subtotal: items.filter(item => item.category === 'labor').reduce((sum, item) => sum + item.total, 0),
        order: 3,
      },
    ];

    // Obtener datos completos del cliente y proyecto
    const selectedClient = clients.find(c => c.id === data.clientId);
    const selectedProject = projects.find(p => p.id === data.projectId);

    const estimate: Estimate = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      estimateNumber: initialData?.estimateNumber || generateEstimateNumber(),
      projectId: data.projectId,
      clientId: data.clientId,
      name: data.name,
      description: data.description,
      status: 'draft',
      sections,
      subtotal,
      tax,
      taxRate,
      total,
      validUntil: new Date(data.validUntil),
      terms: data.terms,
      notes: data.notes,
      // Datos completos del cliente
      clientName: selectedClient?.name || '',
      clientAddress: selectedClient ? `${selectedClient.name}` : '',
      clientEmail: '',
      clientPhone: '',
      // Datos completos del proyecto
      projectName: selectedProject?.name || '',
      projectAddress: selectedProject ? `${selectedProject.name}` : '',
      // Cargar datos del perfil del usuario
      contractorLicense: profile?.njContractorLicense || '',
      contractorName: profile?.companyName || profile?.contactName || '',
      contractorAddress: profile ? `${profile.address}, ${profile.city}, ${profile.state} ${profile.zipCode}` : '',
      contractorPhone: profile?.contactPhone || '',
      contractorEmail: profile?.contactEmail || '',
      cancellationRights: 'Customer has 3 business days to cancel this estimate.',
      warrantyInfo: '1 year warranty on all work performed.',
      createdAt: initialData?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSubmit(estimate);
  };

  return (
    <>
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('title')} - {t('description')}</h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('name')} *</label>
            <input
              {...register('name')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Ej: Estimado para Casa Residencial Norte"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('client')} *</label>
            <div className="flex gap-2">
              <select
                {...register('clientId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
              >
                + Cliente
              </button>
            </div>
            {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('project')} *</label>
            <div className="flex gap-2">
              <select
                {...register('projectId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Seleccionar proyecto</option>
                {projects.map((project) => (
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
            {errors.projectId && <p className="mt-1 text-sm text-red-600">{errors.projectId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Válido Hasta *</label>
            <input
              {...register('validUntil')}
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.validUntil && <p className="mt-1 text-sm text-red-600">{errors.validUntil.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tasa de Impuesto</label>
            <select
              {...register('taxRate', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value={0}>Sin Impuestos (0%)</option>
              <option value={6.25}>Con Impuestos (6.25%)</option>
            </select>
            {errors.taxRate && <p className="mt-1 text-sm text-red-600">{errors.taxRate.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Descripción detallada del trabajo a realizar..."
            />
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{t('items')}</h3>
            <p className="text-sm text-gray-500">{t('addItemsDescription')}</p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('addItem')}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalculatorIcon className="h-12 w-12 mx-auto mb-2" />
            <p>{t('noItems')}</p>
            <p className="text-sm">{t('clickToAdd')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-end p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('description')}</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder={t('description')}
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('quantity')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('unit')}</label>
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('unitPrice')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('type')}</label>
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(item.id, { category: e.target.value as any })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('total')}</label>
                  <div className="block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm font-medium">
                    {formatCurrency(item.total)}
                  </div>
                </div>

                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="inline-flex items-center justify-center w-full px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('title')} - {t('grandTotal')}</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('subtotal')}:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{t('tax')} ({taxRate}%):</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>{t('grandTotal')}:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Términos y Notas */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Términos y Notas</h3>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Términos de Pago</label>
            <input
              {...register('terms')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Net 30 days"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notas Adicionales</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Notas adicionales para el cliente..."
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Guardar Estimado
        </button>
      </div>

    </form>

    {/* Modals - Outside of form to avoid nested form error */}
    {showCreateClient && (
      <CreateClientModal
        isOpen={showCreateClient}
        onClose={() => setShowCreateClient(false)}
        onClientCreated={(client) => {
          onClientCreated?.(client);
          setShowCreateClient(false);
        }}
      />
    )}

    {showCreateProject && (
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onProjectCreated={(project) => {
          onProjectCreated?.(project);
          setShowCreateProject(false);
        }}
      />
    )}
    </>
  );
}
