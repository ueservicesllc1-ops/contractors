'use client';

import React from 'react';
import Link from 'next/link';
import { formatShortDate } from '@/lib/utils';
import { Project } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecentProjectsProps {
  projects: Project[];
}

const statusColors = {
  planning: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  'on-hold': 'bg-orange-100 text-orange-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const getStatusLabels = (t: (key: string) => string) => ({
  planning: t('planning') || 'Planificación',
  active: t('active') || 'Activo',
  'on-hold': t('onHold') || 'En Pausa',
  completed: t('completed') || 'Completado',
  cancelled: t('cancelled') || 'Cancelado',
});

export default function RecentProjects({ projects }: RecentProjectsProps) {
  const { t } = useLanguage();
  const statusLabels = getStatusLabels(t);
  const recentProjects = projects.slice(0, 5);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('recentProjects') || 'Proyectos Recientes'}
        </h3>
        
        {recentProjects.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proyectos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primer proyecto.
            </p>
            <div className="mt-6">
              <Link
                href="/projects/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Nuevo Proyecto
              </Link>
            </div>
          </div>
        ) : (
          <div className="flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {recentProjects.map((project) => (
                <li key={project.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {project.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-gray-500 truncate">
                        {project.client?.name || 'Cliente no asignado'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[project.status]
                          }`}
                        >
                          {statusLabels[project.status]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatShortDate(project.startDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${project.estimatedCost.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{t('budget') || 'Presupuesto'}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {recentProjects.length > 0 && (
          <div className="mt-6">
            <Link
              href="/projects"
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('viewAllProjects') || 'Ver todos los proyectos'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
