'use client';

import React, { useState, useEffect, use } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon, ShareIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { ChangeOrderService } from '@/lib/changeOrderService';
import { ChangeOrder } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePdfGenerator } from '@/hooks/usePdfGenerator';
import toast from 'react-hot-toast';

interface ChangeOrderDetailPageProps {
  params: {
    id: string;
  };
}

export default function ChangeOrderDetailPage({ params }: ChangeOrderDetailPageProps) {
  const resolvedParams = params;
  const { user } = useAuth();
  const { profile } = useProfile();
  const [changeOrder, setChangeOrder] = useState<ChangeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvalUrl, setApprovalUrl] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { generatePdf, generatePdfAlternative } = usePdfGenerator();

  // Cargar Change Order
  useEffect(() => {
    const loadChangeOrder = async () => {
      if (!user || !profile?.userId) return;
      
      try {
        setLoading(true);
        const changeOrders = await ChangeOrderService.getUserChangeOrders(profile.userId);
        const order = changeOrders.find(co => co.id === resolvedParams.id);
        
        if (!order) {
          toast.error('Orden de cambio no encontrada');
          return;
        }
        
        setChangeOrder(order);
        
        // Generar URL de aprobación
        const url = ChangeOrderService.generateApprovalUrl(order.approvalToken);
        setApprovalUrl(url);
      } catch (error) {
        console.error('Error loading change order:', error);
        toast.error('Error al cargar la orden de cambio');
      } finally {
        setLoading(false);
      }
    };

    loadChangeOrder();
  }, [user, profile?.userId, resolvedParams.id]);

  // Copiar URL al portapapeles
  const copyApprovalUrl = async () => {
    try {
      await navigator.clipboard.writeText(approvalUrl);
      toast.success('URL copiada al portapapeles');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Error al copiar la URL');
    }
  };

  // Imprimir orden de cambio
  const handlePrint = () => {
    window.print();
  };

  // Descargar PDF
  const handleDownloadPdf = async () => {
    if (!changeOrder) return;
    
    try {
      setIsGeneratingPdf(true);
      
      const filename = `orden-cambio-${changeOrder.changeOrderNumber}.pdf`;
      
      // Crear una versión simplificada de la orden de cambio sin gradientes
      const createSimplifiedChangeOrder = () => {
        const originalElement = document.getElementById('change-order-container');
        if (!originalElement) return null;
        
        const simplified = originalElement.cloneNode(true) as HTMLElement;
        
        // Función recursiva para limpiar estilos problemáticos
        const cleanElement = (el: HTMLElement) => {
          // Remover todas las clases de gradientes
          const problematicClasses = [
            'bg-gradient-to-r', 'from-slate-50', 'to-blue-50', 'from-gray-50', 'to-slate-50',
            'from-slate-100', 'to-slate-200', 'from-blue-50', 'to-slate-50',
            'from-slate-400', 'to-slate-500', 'bg-gradient-to-r'
          ];
          
          if (el.classList) {
            problematicClasses.forEach(cls => el.classList.remove(cls));
          }
          
          // Aplicar estilos básicos seguros
          el.style.backgroundColor = '#ffffff';
          el.style.color = '#000000';
          el.style.border = '1px solid #e5e7eb';
          
          // Limpiar elementos hijos
          Array.from(el.children).forEach(child => {
            if (child instanceof HTMLElement) {
              cleanElement(child);
            }
          });
        };
        
        cleanElement(simplified);
        
        // Agregar estilos básicos al contenedor
        simplified.style.padding = '20px';
        simplified.style.fontFamily = 'Arial, sans-serif';
        simplified.style.fontSize = '14px';
        simplified.style.lineHeight = '1.5';
        simplified.style.width = '800px';
        
        return simplified;
      };
      
      try {
        // Crear elemento simplificado
        const simplifiedElement = createSimplifiedChangeOrder();
        if (!simplifiedElement) {
          throw new Error('No se pudo crear el elemento simplificado');
        }
        
        // Agregar temporalmente al DOM
        simplifiedElement.style.position = 'absolute';
        simplifiedElement.style.left = '-9999px';
        simplifiedElement.style.top = '0';
        simplifiedElement.id = 'change-order-simplified';
        document.body.appendChild(simplifiedElement);
        
        // Usar método alternativo con elemento simplificado
        await generatePdfAlternative('change-order-simplified', filename);
        toast.success('PDF generado exitosamente');
        
        // Remover elemento temporal
        document.body.removeChild(simplifiedElement);
        
      } catch (error) {
        console.warn('Simplified method failed, trying original:', error);
        // Fallback al método original
        await generatePdfAlternative('change-order-container', filename);
        toast.success('PDF generado usando método alternativo');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsGeneratingPdf(false);
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
      case 'expired': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobado';
      case 'declined': return 'Rechazado';
      case 'expired': return 'Expirado';
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

  if (!changeOrder) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">Orden de cambio no encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              La orden de cambio que buscas no existe o no tienes permisos para verla.
            </p>
            <div className="mt-6">
              <Link
                href="/change-orders"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver a Órdenes de Cambio
              </Link>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const isExpired = new Date() > changeOrder.expiresAt;
  const isResponded = changeOrder.clientResponse !== null;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div id="change-order-container" className="space-y-6">
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
            
            {/* Botones de acción */}
            <div className="flex space-x-3 no-print">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Imprimir
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{changeOrder.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Orden #{changeOrder.changeOrderNumber} • {changeOrder.projectName}
            </p>
          </div>

          {/* Status Banner */}
          <div className={`border rounded-md p-4 ${
            changeOrder.status === 'approved' ? 'bg-green-50 border-green-200' :
            changeOrder.status === 'declined' ? 'bg-red-50 border-red-200' :
            changeOrder.status === 'expired' ? 'bg-gray-50 border-gray-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex">
              {getStatusIcon(changeOrder.status)}
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  changeOrder.status === 'approved' ? 'text-green-800' :
                  changeOrder.status === 'declined' ? 'text-red-800' :
                  changeOrder.status === 'expired' ? 'text-gray-800' :
                  'text-yellow-800'
                }`}>
                  Estado: {getStatusText(changeOrder.status)}
                </h3>
                {changeOrder.clientResponse && (
                  <p className={`mt-1 text-sm ${
                    changeOrder.status === 'approved' ? 'text-green-700' :
                    changeOrder.status === 'declined' ? 'text-red-700' :
                    'text-gray-700'
                  }`}>
                    Respondido el {changeOrder.clientResponseDate ? formatDate(changeOrder.clientResponseDate) : 'Fecha no disponible'}
                    {changeOrder.clientResponseNotes && (
                      <span className="block mt-1">
                        <strong>Notas del cliente:</strong> {changeOrder.clientResponseNotes}
                      </span>
                    )}
                  </p>
                )}
                {isExpired && !isResponded && (
                  <p className="mt-1 text-sm text-gray-700">
                    Esta orden de cambio expiró el {formatDate(changeOrder.expiresAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Approval URL Section */}
          {!isResponded && !isExpired && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Enlace de Aprobación</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comparte este enlace con tu cliente para que pueda aprobar o rechazar la orden de cambio.
                </p>
              </div>
              
              <div className="px-6 py-4">
                <div className="flex">
                  <input
                    type="text"
                    value={approvalUrl}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50"
                  />
                  <button
                    onClick={copyApprovalUrl}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <ShareIcon className="h-4 w-4 mr-2" />
                    Copiar
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Este enlace expira el {formatDate(changeOrder.expiresAt)}
                </p>
              </div>
            </div>
          )}

          {/* Change Order Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Detalles de la Orden de Cambio</h2>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Project and Client Info */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Proyecto</h3>
                  <p className="mt-1 text-sm text-gray-700">{changeOrder.projectName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Cliente</h3>
                  <p className="mt-1 text-sm text-gray-700">{changeOrder.clientName}</p>
                  <p className="text-sm text-gray-500">{changeOrder.clientEmail}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-900">Descripción del Cambio</h3>
                <p className="mt-1 text-sm text-gray-700">{changeOrder.description}</p>
              </div>

              {/* Reason */}
              <div>
                <h3 className="text-sm font-medium text-gray-900">Razón del Cambio</h3>
                <p className="mt-1 text-sm text-gray-700">{changeOrder.reason}</p>
              </div>

              {/* Impact on Schedule */}
              {changeOrder.impactOnSchedule && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Impacto en el Cronograma</h3>
                  <p className="mt-1 text-sm text-gray-700">{changeOrder.impactOnSchedule}</p>
                </div>
              )}

              {/* Items */}
              {changeOrder.items && changeOrder.items.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Items del Cambio</h3>
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio Unit.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {changeOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(item.total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.type === 'addition' ? 'bg-green-100 text-green-800' :
                                item.type === 'deletion' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.type === 'addition' ? 'Adición' :
                                 item.type === 'deletion' ? 'Eliminación' : 'Modificación'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Resumen Financiero</h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Monto Original</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {formatCurrency(changeOrder.originalAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Cambio</dt>
                    <dd className="text-lg font-semibold text-blue-600">
                      {formatCurrency(changeOrder.changeAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nuevo Total</dt>
                    <dd className="text-lg font-semibold text-green-600">
                      {formatCurrency(changeOrder.newTotalAmount)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Creado</h3>
                  <p className="mt-1 text-sm text-gray-700">{formatDate(changeOrder.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Expira</h3>
                  <p className="mt-1 text-sm text-gray-700">{formatDate(changeOrder.expiresAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
