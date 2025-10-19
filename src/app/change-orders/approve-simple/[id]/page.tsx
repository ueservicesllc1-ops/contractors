'use client';

import React, { useState, useEffect, use } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { ChangeOrderService } from '@/lib/changeOrderService';
import { ChangeOrder } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ApproveChangeOrderPageProps {
  params: {
    id: string;
  };
}

export default function ApproveChangeOrderPage({ params }: ApproveChangeOrderPageProps) {
  const resolvedParams = params;
  const [changeOrder, setChangeOrder] = useState<ChangeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

  // Cargar Change Order
  useEffect(() => {
    const loadChangeOrder = async () => {
      try {
        setLoading(true);
        const order = await ChangeOrderService.getChangeOrderById(resolvedParams.id);
        
        if (!order) {
          setError('Orden de cambio no encontrada');
          return;
        }
        
        if (order.status !== 'pending') {
          setError('Esta orden de cambio ya fue procesada');
          return;
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
  }, [resolvedParams.id]);

  // Aprobar orden
  const handleApprove = async () => {
    if (!changeOrder) return;
    
    try {
      setApproving(true);
      await ChangeOrderService.approveChangeOrder(changeOrder.id);
      toast.success('Orden de cambio aprobada exitosamente');
      
      // Actualizar el estado local
      setChangeOrder(prev => prev ? { ...prev, status: 'approved' as const } : null);
    } catch (error) {
      console.error('Error approving change order:', error);
      toast.error('Error al aprobar la orden de cambio');
    } finally {
      setApproving(false);
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
          <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const isApproved = changeOrder.status === 'approved';

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
        {isApproved && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Orden de Cambio Aprobada
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Esta orden de cambio ha sido aprobada exitosamente.
                </p>
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

            {/* Financial Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Resumen Financiero</h3>
              
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
          </div>
        </div>

        {/* Políticas de Cambio */}
        {!isApproved && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-4">
              📋 Políticas de Cambio de Orden
            </h3>
            <div className="space-y-3 text-sm text-yellow-700">
              <p>
                <strong>1. Aceptación del Cambio:</strong> Al aprobar esta orden de cambio, usted acepta el trabajo adicional y el costo correspondiente.
              </p>
              <p>
                <strong>2. Modificación del Contrato:</strong> Este cambio modifica el contrato original y se agregará al costo total del proyecto.
              </p>
              <p>
                <strong>3. Cronograma:</strong> El cambio puede afectar el cronograma del proyecto. Se le notificará sobre cualquier retraso.
              </p>
              <p>
                <strong>4. Pago:</strong> El monto adicional será incluido en la próxima factura o al final del proyecto.
              </p>
              <p>
                <strong>5. Finalización:</strong> Una vez aprobado, el cambio no puede ser revertido sin un nuevo acuerdo.
              </p>
            </div>
            
            <div className="mt-4 flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="accept-policies"
                  type="checkbox"
                  checked={acceptedPolicies}
                  onChange={(e) => setAcceptedPolicies(e.target.checked)}
                  className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="accept-policies" className="font-medium text-yellow-800">
                  He leído y acepto las políticas de cambio de orden
                </label>
                <p className="text-yellow-600">
                  Debe marcar esta casilla para poder aprobar la orden de cambio
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Approve Button */}
        {!isApproved && (
          <div className="mt-8 text-center">
            <button
              onClick={handleApprove}
              disabled={approving || !acceptedPolicies}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircleIcon className="h-6 w-6 mr-3" />
              {approving ? 'Aprobando...' : 'Aprobar Orden de Cambio'}
            </button>
            {!acceptedPolicies && (
              <p className="mt-2 text-sm text-red-500">
                Debe aceptar las políticas para poder aprobar la orden
              </p>
            )}
            {acceptedPolicies && (
              <p className="mt-2 text-sm text-gray-500">
                Al hacer clic en &quot;Aprobar&quot;, aceptas el cambio y el costo adicional
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
