'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { PlusIcon, EyeIcon, TrashIcon, ClockIcon, CheckCircleIcon, XCircleIcon, LinkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChangeOrderService } from '@/lib/changeOrderService';
import { ChangeOrder } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ChangeOrdersPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ChangeOrder | null>(null);

  // Cargar Change Orders
  useEffect(() => {
    const loadChangeOrders = async () => {
      if (!user || !profile?.userId) return;
      
      try {
        setLoading(true);
        const userChangeOrders = await ChangeOrderService.getUserChangeOrders(profile.userId);
        setChangeOrders(userChangeOrders);
      } catch (error) {
        console.error('Error loading change orders:', error);
        toast.error('Error al cargar las órdenes de cambio');
      } finally {
        setLoading(false);
      }
    };

    loadChangeOrders();
  }, [user, profile?.userId]);

  // Filtrar Change Orders
  const filteredChangeOrders = changeOrders.filter(changeOrder =>
    changeOrder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    changeOrder.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    changeOrder.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    changeOrder.changeOrderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejar eliminación
  const handleDelete = async (changeOrderId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta orden de cambio?')) return;
    
    try {
      await ChangeOrderService.deleteChangeOrder(changeOrderId);
      setChangeOrders(prev => prev.filter(co => co.id !== changeOrderId));
      toast.success('Orden de cambio eliminada');
    } catch (error) {
      console.error('Error deleting change order:', error);
      toast.error('Error al eliminar la orden de cambio');
    }
  };

  // Generar enlace de aprobación
  const handleGenerateLink = (changeOrder: ChangeOrder) => {
    setSelectedOrder(changeOrder);
    setShowLinkModal(true);
  };

  // Copiar enlace
  const copyLink = async () => {
    if (!selectedOrder) return;
    
    try {
      const link = `${window.location.origin}/change-orders/approve-simple/${selectedOrder.id}`;
      await navigator.clipboard.writeText(link);
      toast.success('Enlace copiado al portapapeles');
      setShowLinkModal(false);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Error al copiar el enlace');
    }
  };

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'declined': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'approved': return <CheckCircleIcon className="h-4 w-4" />;
      case 'declined': return <XCircleIcon className="h-4 w-4" />;
      case 'expired': return <ClockIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('pending') || 'Pendiente';
      case 'approved': return t('approved') || 'Aprobado';
      case 'declined': return t('declined') || 'Rechazado';
      case 'expired': return t('expired') || 'Expirado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('navigation.changeOrders') || 'Órdenes de Cambio'}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('manageChangeOrders') || 'Gestiona las modificaciones a tus proyectos'}
              </p>
            </div>
            <Link
              href="/change-orders/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('newChangeOrder') || 'Nueva Orden de Cambio'}
            </Link>
          </div>

          {/* Search */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="max-w-md">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                {t('searchChangeOrders') || 'Buscar órdenes de cambio'}
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t('searchPlaceholder') || 'Buscar por título, proyecto, cliente o número...'}
              />
            </div>
          </div>

          {/* Change Orders List */}
          <div className="bg-white shadow rounded-lg">
            {filteredChangeOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <ClockIcon className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay órdenes de cambio</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'No se encontraron órdenes que coincidan con tu búsqueda.' : 'Comienza creando tu primera orden de cambio.'}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Link
                      href="/change-orders/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      {t('newChangeOrder') || 'Nueva Orden de Cambio'}
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('changeOrder') || 'Orden de Cambio'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.project') || 'Proyecto'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.client') || 'Cliente'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('amount') || 'Monto'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.status') || 'Estado'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.date') || 'Fecha'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.actions') || 'Acciones'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredChangeOrders.map((changeOrder) => (
                      <tr key={changeOrder.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {changeOrder.changeOrderNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {changeOrder.title}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{changeOrder.projectName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{changeOrder.clientName}</div>
                          <div className="text-sm text-gray-500">{changeOrder.clientEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(changeOrder.changeAmount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Total: {formatCurrency(changeOrder.newTotalAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(changeOrder.status)}`}>
                            {getStatusIcon(changeOrder.status)}
                            <span className="ml-1">{getStatusText(changeOrder.status)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(changeOrder.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2 items-center">
                            <Link
                              href={`/change-orders/${changeOrder.id}`}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            {changeOrder.status === 'pending' && (
                              <button
                                onClick={() => handleGenerateLink(changeOrder)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Generar enlace de aprobación"
                              >
                                <LinkIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(changeOrder.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal simple para enlace */}
        {showLinkModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                  <LinkIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-2 text-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('approvalLink') || 'Enlace de Aprobación'}
                  </h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                      <strong>{t('common.client') || 'Cliente'}:</strong> {selectedOrder.clientName}
                    </p>
                    <p className="text-sm text-gray-500">
                      <strong>{t('common.project') || 'Proyecto'}:</strong> {selectedOrder.projectName}
                    </p>
                    <p className="text-sm text-gray-500">
                      <strong>{t('amount') || 'Monto'}:</strong> {formatCurrency(selectedOrder.changeAmount)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={copyLink}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    📋 {t('copyLink') || 'Copiar Enlace'}
                  </button>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => setShowLinkModal(false)}
                    className="w-full bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    {t('common.close') || 'Cerrar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </AppLayout>
    </ProtectedRoute>
  );
}