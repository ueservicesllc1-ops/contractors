'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Estimate } from '@/types';
import { formatShortDate, formatCurrency } from '@/lib/utils';
import { EstimateService } from '@/lib/estimateService';
import { ProjectService } from '@/lib/projectService';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface EstimateCardProps {
  estimate: Estimate;
  projectName?: string;
  clientName?: string;
  onDelete?: (estimateId: string) => void;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  sent: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const getStatusLabels = (t: (key: string) => string) => ({
  draft: t('estimate.status.draft') || 'Borrador',
  sent: t('estimate.status.sent') || 'Enviado',
  approved: t('estimate.status.approved') || 'Aprobado',
  rejected: t('estimate.status.rejected') || 'Rechazado',
});

const statusIcons = {
  draft: ClockIcon,
  sent: ShareIcon,
  approved: CheckCircleIcon,
  rejected: XCircleIcon,
};

export default function EstimateCard({ estimate, projectName, clientName, onDelete }: EstimateCardProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const statusLabels = getStatusLabels(t);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const StatusIcon = statusIcons[estimate.status];

  const getDaysUntilExpiry = () => {
    const today = new Date();
    const expiryDate = new Date(estimate.validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este estimado? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting estimate:', estimate.id);
      await EstimateService.deleteEstimate(estimate.id);
      console.log('✅ Deleted successfully');
      toast.success('Estimado eliminado');
      
      // Hot reload sutil - solo actualizar el estado local
      console.log('🔄 Updating local state...');
      onDelete?.(estimate.id);
      
    } catch (error) {
      console.error('❌ Delete error:', error);
      toast.error('Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAcceptEstimate = async () => {
    if (!confirm('¿Marcar este estimado como aceptado por el cliente? Esto actualizará el presupuesto del proyecto.')) {
      return;
    }

    setIsAccepting(true);
    
    try {
      // Actualizar el estimado a 'approved'
      await EstimateService.updateEstimate(estimate.id, { status: 'approved' });
      
      // Actualizar el presupuesto del proyecto
      await ProjectService.updateProjectBudget(estimate.projectId, estimate.total);
      
      toast.success('Estimado aceptado y presupuesto del proyecto actualizado');
      
      // Recargar la página para mostrar los cambios
      router.refresh();
      
    } catch (error) {
      console.error('❌ Accept estimate error:', error);
      toast.error('Error al aceptar el estimado');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">
                {estimate.name}
              </h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {estimate.estimateNumber}
            </p>
          </div>
          {/* Estado oculto - no mostrar status */}
        </div>

        {/* Project and Client Info */}
        <div className="mt-4 space-y-2">
          {projectName && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">{t('estimate.project') || 'Proyecto'}:</span>
              <span className="ml-2">{projectName}</span>
            </div>
          )}
          {clientName && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">{t('estimate.client') || 'Cliente'}:</span>
              <span className="ml-2">{clientName}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {estimate.description && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 line-clamp-2">
              {estimate.description}
            </p>
          </div>
        )}

        {/* Financial Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">{t('estimate.subtotal') || 'Subtotal'}:</span>
              <p className="font-medium text-gray-900">{formatCurrency(estimate.subtotal)}</p>
            </div>
            <div>
              <span className="text-gray-500">{t('estimate.tax') || 'Impuestos'}:</span>
              <p className="font-medium text-gray-900">{formatCurrency(estimate.tax)}</p>
            </div>
            <div>
              <span className="text-gray-500">{t('estimate.total') || 'Total'}:</span>
              <p className="font-bold text-gray-900">{formatCurrency(estimate.total)}</p>
            </div>
          </div>
        </div>

        {/* Expiry Warning */}
        {(isExpired || isExpiringSoon) && (
          <div className={`mt-3 p-2 rounded-md ${
            isExpired ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center">
              <ExclamationTriangleIcon className={`h-4 w-4 mr-2 ${
                isExpired ? 'text-red-500' : 'text-yellow-500'
              }`} />
              <span className={`text-xs font-medium ${
                isExpired ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {isExpired 
                  ? `Expiró hace ${Math.abs(daysUntilExpiry)} días`
                  : `Expira en ${daysUntilExpiry} días`
                }
              </span>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{t('estimate.created') || 'Creado'}: {formatShortDate(estimate.createdAt)}</span>
            <span>{t('estimate.validUntil') || 'Válido hasta'}: {formatShortDate(estimate.validUntil)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Link
              href={`/estimates/${estimate.id}`}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              {t('common.view') || 'Ver'}
            </Link>
            <Link
              href={`/estimates/${estimate.id}/edit`}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              {t('common.edit') || 'Editar'}
            </Link>
            {estimate.status !== 'approved' && (
              <button
                onClick={handleAcceptEstimate}
                disabled={isAccepting}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                {isAccepting ? 'Aceptando...' : 'Aceptado por cliente'}
              </button>
            )}
            {estimate.status === 'approved' && (
              <div className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-500">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Aceptado
              </div>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
