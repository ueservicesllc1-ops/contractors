'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { InvoiceService } from '@/lib/invoiceService';

interface InvoiceStatsData {
  totalInvoices: number;
  totalAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  pendingCount: number;
  overdueCount: number;
}

export default function InvoiceStats() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const [stats, setStats] = useState<InvoiceStatsData>({
    totalInvoices: 0,
    totalAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    pendingCount: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoiceStats = async () => {
      if (!user || !profile?.userId) return;

      try {
        setLoading(true);
        const invoices = await InvoiceService.getUserInvoices(profile.userId);
        
        const totalInvoices = invoices.length;
        const totalAmount = invoices
          .filter(i => i.status === 'paid')
          .reduce((sum, invoice) => sum + invoice.total, 0);
        const pendingAmount = invoices
          .filter(i => i.status === 'sent')
          .reduce((sum, invoice) => sum + invoice.total, 0);
        const overdueAmount = invoices
          .filter(i => i.status === 'overdue')
          .reduce((sum, invoice) => sum + invoice.total, 0);
        const pendingCount = invoices.filter(i => i.status === 'sent').length;
        const overdueCount = invoices.filter(i => i.status === 'overdue').length;

        setStats({
          totalInvoices,
          totalAmount,
          pendingAmount,
          overdueAmount,
          pendingCount,
          overdueCount,
        });
      } catch (error) {
        console.error('Error loading invoice stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoiceStats();
  }, [user, profile?.userId]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('billingSummary') || 'Resumen de Facturación'}</h2>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">{t('billingSummary') || 'Resumen de Facturación'}</h2>
          <Link
            href="/invoices"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {t('viewAll') || 'Ver todas'}
          </Link>
        </div>
      </div>
      
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Invoices */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">{t('totalInvoices') || 'Total Facturas'}</p>
                <p className="text-2xl font-semibold text-blue-900">{stats.totalInvoices}</p>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">{t('totalBilled') || 'Total Facturado'}</p>
                <p className="text-2xl font-semibold text-green-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Pending Amount */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">{t('pending') || 'Pendiente'}</p>
                <p className="text-2xl font-semibold text-yellow-900">{formatCurrency(stats.pendingAmount)}</p>
                <p className="text-xs text-yellow-700">{stats.pendingCount} {t('invoices') || 'facturas'}</p>
              </div>
            </div>
          </div>

          {/* Overdue Amount */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">{t('overdue') || 'Vencidas'}</p>
                <p className="text-2xl font-semibold text-red-900">{formatCurrency(stats.overdueAmount)}</p>
                <p className="text-xs text-red-700">{stats.overdueCount} {t('invoices') || 'facturas'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity - Solo mostrar si hay datos */}
        {stats.totalInvoices > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Actividad Reciente</h3>
            <div className="text-sm text-gray-500 text-center py-4">
              No hay actividad reciente disponible
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

