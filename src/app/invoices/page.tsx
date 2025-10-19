'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Invoice } from '@/types';
import { formatCurrency, formatDate, getInvoiceStatusColor, getInvoiceStatusText, isInvoiceOverdue } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { InvoiceService } from '@/lib/invoiceService';
import toast from 'react-hot-toast';


export default function InvoicesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Función para cargar facturas
  const loadInvoices = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userInvoices = await InvoiceService.getUserInvoices(user.id);
      console.log('📋 Loaded invoices:', userInvoices.map(inv => ({
        id: inv.id,
        number: inv.invoiceNumber,
        status: inv.status,
        total: inv.total
      })));
      setInvoices(userInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar facturas del usuario
  useEffect(() => {
    loadInvoices();
  }, [user]);

  // Función para refrescar facturas
  const handleRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing invoices...');
      const userInvoices = await InvoiceService.getUserInvoices(user.id);
      console.log('📋 Refreshed invoices:', userInvoices.map(inv => ({
        id: inv.id,
        number: inv.invoiceNumber,
        status: inv.status,
        total: inv.total
      })));
      setInvoices(userInvoices);
      toast.success(`Lista actualizada: ${userInvoices.length} facturas`);
    } catch (error) {
      console.error('Error refreshing invoices:', error);
      toast.error('Error al actualizar la lista');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.projectId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (invoice: Invoice) => {
    const isOverdue = invoice.status === 'sent' && isInvoiceOverdue(invoice.dueDate);
    const status = isOverdue ? 'overdue' : invoice.status;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInvoiceStatusColor(status)}`}>
        {getInvoiceStatusText(status)}
      </span>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando facturas...</p>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('navigation.invoices') || 'Facturas'}</h1>
            <p className="text-gray-600">{t('invoices.manageInvoices') || 'Gestiona tus facturas y pagos'}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? (t('common.updating') || 'Actualizando...') : (t('common.refresh') || 'Actualizar')}
          </button>
          <Link
            href="/invoices/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('invoices.newInvoice') || 'Nueva Factura'}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">T</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('invoices.totalInvoices') || 'Total Facturas'}</p>
              <p className="text-2xl font-semibold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">$</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('invoices.totalBilled') || 'Total Facturado'}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total, 0))}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <span className="text-yellow-600 font-semibold text-sm">P</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('invoices.pending') || 'Pendientes'}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {invoices.filter(inv => inv.status === 'sent').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                <span className="text-red-600 font-semibold text-sm">V</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('invoices.overdue') || 'Vencidas'}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {invoices.filter(inv => inv.status === 'overdue' || (inv.status === 'sent' && isInvoiceOverdue(inv.dueDate))).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.search') || 'Buscar'}
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('invoices.searchPlaceholder') || 'Número, cliente, proyecto...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.status') || 'Estado'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('invoices.allStatuses') || 'Todos los estados'}</option>
              <option value="draft">{t('invoice.status.draft') || 'Borrador'}</option>
              <option value="sent">{t('invoice.status.sent') || 'Enviada'}</option>
              <option value="paid">{t('invoice.status.paid') || 'Pagada'}</option>
              <option value="overdue">{t('invoice.status.overdue') || 'Vencida'}</option>
              <option value="cancelled">{t('invoice.status.cancelled') || 'Cancelada'}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.type') || 'Tipo'}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('invoices.allTypes') || 'Todos los tipos'}</option>
              <option value="progress">{t('invoice.type.progress') || 'Progreso'}</option>
              <option value="final">{t('invoice.type.final') || 'Final'}</option>
              <option value="change_order">{t('invoice.type.changeOrder') || 'Orden de Cambio'}</option>
              <option value="retainer">{t('invoice.type.retainer') || 'Anticipo'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List - Responsive Design */}
      <div className="space-y-4">
        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden lg:block bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoices.invoice') || 'Factura'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.client') || 'Cliente'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.date') || 'Fecha'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.total') || 'Total'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status') || 'Estado'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions') || 'Acciones'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.type === 'progress' ? (t('invoice.type.progress') || 'Progreso') : 
                           invoice.type === 'final' ? (t('invoice.type.final') || 'Final') :
                           invoice.type === 'change_order' ? (t('invoice.type.changeOrder') || 'Orden de Cambio') : (t('invoice.type.retainer') || 'Anticipo')}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{invoice.clientName}</div>
                      <div className="text-sm text-gray-500">{invoice.clientEmail}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(invoice)}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t('common.view') || 'Ver'}
                        </Link>
                        <Link
                          href={`/invoices/${invoice.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t('common.edit') || 'Editar'}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View - Hidden on desktop */}
        <div className="lg:hidden space-y-4">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white shadow rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {invoice.invoiceNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {invoice.type === 'progress' ? (t('invoice.type.progress') || 'Progreso') : 
                     invoice.type === 'final' ? (t('invoice.type.final') || 'Final') :
                     invoice.type === 'change_order' ? (t('invoice.type.changeOrder') || 'Orden de Cambio') : (t('invoice.type.retainer') || 'Anticipo')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(invoice.total)}
                  </div>
                  {getStatusBadge(invoice)}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common.client') || 'Cliente'}:</span>
                  <span className="text-gray-900">{invoice.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common.email') || 'Email'}:</span>
                  <span className="text-gray-900">{invoice.clientEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common.project') || 'Proyecto'}:</span>
                  <span className="text-gray-900">#{invoice.projectId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common.date') || 'Fecha'}:</span>
                  <span className="text-gray-900">{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('invoice.dueDate') || 'Vencimiento'}:</span>
                  <span className="text-gray-900">{formatDate(invoice.dueDate)}</span>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  {t('common.view') || 'Ver'}
                </Link>
                <Link
                  href={`/invoices/${invoice.id}/edit`}
                  className="flex-1 text-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
                >
                  {t('common.edit') || 'Editar'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay facturas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No se encontraron facturas con los filtros aplicados.'
                : 'Comienza creando tu primera factura.'}
            </p>
          </div>
        </div>
      )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}