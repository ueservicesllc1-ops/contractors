'use client';

import React, { useState, useEffect, use } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ChangeOrderService } from '@/lib/changeOrderService';
import { EmailService } from '@/lib/emailService';
import { ChangeOrder } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ApproveChangeOrderPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function ApproveChangeOrderPage({ params }: ApproveChangeOrderPageProps) {
  const resolvedParams = use(params);
  const [changeOrder, setChangeOrder] = useState<ChangeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<'approved' | 'declined' | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Cargar Change Order
  useEffect(() => {
    const loadChangeOrder = async () => {
      try {
        setLoading(true);
        const order = await ChangeOrderService.getChangeOrderByToken(resolvedParams.token);

        if (!order) {
          setError('Orden de cambio no encontrada o enlace inválido');
          return;
        }

        // Verificar si ya expiró
        if (new Date() > order.expiresAt) {
          setError('Esta orden de cambio ha expirado');
          return;
        }

        // Verificar si ya fue respondida
        if (order.clientResponse) {
          setResponse(order.clientResponse);
          setNotes(order.clientResponseNotes || '');
        }

        setChangeOrder(order);
      } catch (error) {
        console.error('Error loading change order:', error);
        setError('Error al cargar la orden de cambio');
      } finally {
        setLoading(false);
      }
    };

    loadChangeOrder();
  }, [resolvedParams.token]);

  // Manejar respuesta
  const handleResponse = async (responseType: 'approved' | 'declined') => {
    if (!changeOrder) return;

    try {
      setSubmitting(true);
      await ChangeOrderService.respondToChangeOrder(resolvedParams.token, responseType, notes);

      // Enviar email de confirmación al contratista
      try {
        await EmailService.sendResponseConfirmationEmail(
          changeOrder,
          responseType,
          'contractor@example.com' // TODO: Obtener email del contratista del perfil
        );
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // No mostramos error al usuario por el email, solo log
      }

      setResponse(responseType);
      toast.success(`Orden de cambio ${responseType === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
    } catch (error) {
      console.error('Error responding to change order:', error);
      toast.error('Error al procesar la respuesta');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !changeOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date() > changeOrder.expiresAt;
  const isResponded = changeOrder.clientResponse !== null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Orden de Cambio</h1>
          <p className="mt-2 text-lg text-gray-600">
            {changeOrder.projectName} - {changeOrder.clientName}
          </p>
          <p className="text-sm text-gray-500">
            Orden #{changeOrder.changeOrderNumber}
          </p>
        </div>

        {/* Status Banner */}
        {isExpired && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Orden de Cambio Expirada
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Esta orden de cambio ha expirado y ya no puede ser procesada.
                </p>
              </div>
            </div>
          </div>
        )}

        {isResponded && (
          <div className={`mb-6 border rounded-md p-4 ${changeOrder.clientResponse === 'approved'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
            }`}>
            <div className="flex">
              {changeOrder.clientResponse === 'approved' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-400" />
              )}
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${changeOrder.clientResponse === 'approved' ? 'text-green-800' : 'text-red-800'
                  }`}>
                  Orden de Cambio {changeOrder.clientResponse === 'approved' ? 'Aprobada' : 'Rechazada'}
                </h3>
                <div className={`mt-1 text-sm ${changeOrder.clientResponse === 'approved' ? 'text-green-700' : 'text-red-700'
                  }`}>
                  <p>
                    Respondida el {changeOrder.clientResponseDate ? formatDate(changeOrder.clientResponseDate) : 'Fecha no disponible'}
                  </p>
                  {changeOrder.clientResponseNotes && (
                    <p className="mt-1">
                      <strong>Notas:</strong> {changeOrder.clientResponseNotes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Order Details */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{changeOrder.title}</h2>
          </div>

          <div className="px-6 py-4 space-y-6">
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'addition' ? 'bg-green-100 text-green-800' :
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

              {/* Monto Adicional Destacado */}
              <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-blue-900">
                    💰 Monto Adicional del Cambio
                  </h4>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {formatCurrency(changeOrder.changeAmount)}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Este es el costo adicional que se cobrará por este cambio
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Monto Original del Proyecto</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {formatCurrency(changeOrder.originalAmount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Monto Adicional</dt>
                  <dd className="text-lg font-semibold text-blue-600">
                    {formatCurrency(changeOrder.changeAmount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nuevo Total del Proyecto</dt>
                  <dd className="text-lg font-semibold text-green-600">
                    {formatCurrency(changeOrder.newTotalAmount)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Expiration Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <ClockIcon className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Fecha de Expiración
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Esta orden de cambio expira el {changeOrder.expiresAt ? formatDate(changeOrder.expiresAt) : 'Fecha no disponible'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Response Section */}
        {!isExpired && !isResponded && (
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Su Respuesta</h2>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Comentarios (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Agregue cualquier comentario sobre esta orden de cambio..."
                />
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleResponse('declined')}
                  disabled={submitting}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  {submitting ? 'Procesando...' : 'Rechazar'}
                </button>

                <button
                  onClick={() => handleResponse('approved')}
                  disabled={submitting}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {submitting ? 'Procesando...' : 'Aprobar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
