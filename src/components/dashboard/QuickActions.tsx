'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  CalculatorIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import CreateClientModal from '@/components/clients/CreateClientModal';
import { Project, Client } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

const getQuickActions = (t: (key: string) => string) => [
  {
    name: t('newProject') || 'Nuevo Proyecto',
    description: t('newProjectDesc') || 'Crear un nuevo proyecto de construcción',
    type: 'modal',
    icon: PlusIcon,
    color: 'bg-blue-500',
  },
  {
    name: t('createEstimate') || 'Crear Estimado',
    description: t('createEstimateDesc') || 'Generar un nuevo presupuesto',
    href: '/estimates/new',
    icon: CalculatorIcon,
    color: 'bg-green-500',
  },
  {
    name: t('newInvoice') || 'Nueva Factura',
    description: t('newInvoiceDesc') || 'Crear una factura para el cliente',
    href: '/invoices/new',
    icon: DocumentTextIcon,
    color: 'bg-yellow-500',
  },
  {
    name: t('addClient') || 'Agregar Cliente',
    description: t('addClientDesc') || 'Registrar un nuevo cliente',
    type: 'modal',
    icon: UserGroupIcon,
    color: 'bg-purple-500',
  },
];

export default function QuickActions() {
  const { t } = useLanguage();
  const quickActions = getQuickActions(t);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('quickActions') || 'Acciones Rápidas'}
        </h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((action) => {
            const handleClick = () => {
              if (action.type === 'modal') {
                if (action.name === 'Nuevo Proyecto') {
                  setShowCreateProject(true);
                } else if (action.name === 'Agregar Cliente') {
                  setShowCreateClient(true);
                }
              }
            };

            const content = (
              <div
                key={action.name}
                className={`relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors ${
                  action.type === 'modal' ? 'cursor-pointer' : ''
                }`}
                onClick={action.type === 'modal' ? handleClick : undefined}
              >
                <div className={`flex-shrink-0 rounded-md p-2 ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">
                    {action.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {action.description}
                  </p>
                </div>
              </div>
            );

            return action.href ? (
              <Link key={action.name} href={action.href}>
                {content}
              </Link>
            ) : (
              content
            );
          })}
        </div>

        {/* Modales */}
        <CreateProjectModal
          isOpen={showCreateProject}
          onClose={() => setShowCreateProject(false)}
          onProjectCreated={() => setShowCreateProject(false)}
        />

        <CreateClientModal
          isOpen={showCreateClient}
          onClose={() => setShowCreateClient(false)}
          onClientCreated={() => setShowCreateClient(false)}
        />
      </div>
    </div>
  );
}
