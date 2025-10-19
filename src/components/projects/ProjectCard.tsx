'use client';

import React from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { formatShortDate, formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface ProjectCardProps {
  project: Project;
}

const statusColors = {
  planning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  'on-hold': 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const getStatusLabels = (t: (key: string) => string) => ({
  planning: t('planning') || 'Planificación',
  active: t('active') || 'Activo',
  'on-hold': t('onHold') || 'En Pausa',
  completed: t('completed') || 'Completado',
  cancelled: t('cancelled') || 'Cancelado',
});

export default function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useLanguage();
  const statusLabels = getStatusLabels(t);
  const progressPercentage = project.estimatedCost > 0 
    ? Math.min((project.actualCost / project.estimatedCost) * 100, 100)
    : 0;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link
              href={`/projects/${project.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {project.name}
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              {project.projectNumber}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              statusColors[project.status]
            }`}
          >
            {statusLabels[project.status]}
          </span>
        </div>

        {/* Client and Location */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>{project.client?.name || 'Cliente no asignado'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>{project.address}, {project.city}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>{t('startDate') || 'Inicio'}: {formatShortDate(project.startDate)}</span>
            {project.endDate && (
              <span className="ml-4">{t('endDate') || 'Fin'}: {formatShortDate(project.endDate)}</span>
            )}
          </div>
        </div>

        {/* Budget Information */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-gray-500">{t('budget') || 'Presupuesto'}:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatCurrency(project.estimatedCost)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">{t('spent') || 'Gastado'}:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatCurrency(project.actualCost)}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{t('budgetProgress') || 'Progreso del presupuesto'}</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  progressPercentage > 100 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Phases */}
        {project.phases && project.phases.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Fases del Proyecto
            </h4>
            <div className="space-y-1">
              {project.phases.slice(0, 3).map((phase) => (
                <div key={phase.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{phase.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    phase.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : phase.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {phase.status === 'completed' ? 'Completado' :
                     phase.status === 'in-progress' ? (t('inProgress') || 'En Progreso') : (t('notStarted') || 'No Iniciado')}
                  </span>
                </div>
              ))}
              {project.phases.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{project.phases.length - 3} fases más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
          <Link
            href={`/projects/${project.id}`}
            className="flex-1 text-center py-2 px-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            {t('viewDetails') || 'Ver Detalles'}
          </Link>
          <Link
            href={`/projects/${project.id}/edit`}
            className="flex-1 text-center py-2 px-3 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {t('edit') || 'Editar'}
          </Link>
        </div>
      </div>
    </div>
  );
}
