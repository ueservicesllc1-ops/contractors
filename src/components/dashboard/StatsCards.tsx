'use client';

import React from 'react';
import {
  FolderIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatsCardsProps {
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalRevenue: number;
    pendingInvoices: number;
  };
}

const getStats = (t: (key: string) => string) => [
  {
    name: t('totalProjects') || 'Total Proyectos',
    value: '0',
    icon: FolderIcon,
    change: '',
    changeType: 'neutral',
    color: 'bg-blue-500',
  },
  {
    name: t('activeProjects') || 'Proyectos Activos',
    value: '0',
    icon: ClockIcon,
    change: '',
    changeType: 'neutral',
    color: 'bg-green-500',
  },
  {
    name: t('totalRevenue') || 'Ingresos Totales',
    value: '$0',
    icon: CurrencyDollarIcon,
    change: '',
    changeType: 'neutral',
    color: 'bg-yellow-500',
  },
  {
    name: t('pendingInvoices') || 'Facturas Pendientes',
    value: '0',
    icon: ExclamationTriangleIcon,
    change: '',
    changeType: 'neutral',
    color: 'bg-red-500',
  },
];

export default function StatsCards({ stats: statsData }: StatsCardsProps) {
  const { t } = useLanguage();
  const stats = getStats(t);
  
  const displayStats = [
    {
      ...stats[0],
      value: statsData.totalProjects.toString(),
    },
    {
      ...stats[1],
      value: statsData.activeProjects.toString(),
    },
    {
      ...stats[2],
      value: formatCurrency(statsData.totalRevenue),
    },
    {
      ...stats[3],
      value: statsData.pendingInvoices.toString(),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {displayStats.map((item) => (
        <div
          key={item.name}
          className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:px-6 sm:py-6"
        >
          <dt>
            <div className={`absolute rounded-md p-3 ${item.color}`}>
              <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
              {item.name}
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{item.value}</p>
            {item.change && (
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'increase' ? 'text-green-600' : 
                  item.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {item.change}
              </p>
            )}
          </dd>
        </div>
      ))}
    </div>
  );
}
