'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProjectService } from '@/lib/projectService';
import { InvoiceService } from '@/lib/invoiceService';
import { ChangeOrderService } from '@/lib/changeOrderService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import toast from 'react-hot-toast';

interface ReportData {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
  changeOrders: number;
  approvedChangeOrders: number;
  monthlyRevenue: number;
  profitMargin: number;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const { generatePdf, generateExcel } = useReportGenerator();

  // Función para cargar datos de reportes
  const loadReportData = async () => {
    if (!user || !profile?.userId) return;
    
    try {
      setLoading(true);
      
      console.log('📊 Loading report data for user:', profile.userId);
      
      // Cargar proyectos
      const projects = await ProjectService.getUserProjects(profile.userId);
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      
      // Cargar facturas
      const invoices = await InvoiceService.getUserInvoices(profile.userId);
      console.log('📋 All invoices loaded:', invoices.map(inv => ({
        id: inv.id,
        number: inv.invoiceNumber,
        status: inv.status,
        total: inv.total,
        paidDate: inv.paidDate
      })));
      
      const pendingInvoices = invoices.filter(i => i.status === 'sent').length;
      
      // Cargar órdenes de cambio
      const changeOrders = await ChangeOrderService.getUserChangeOrders(profile.userId);
      const approvedChangeOrders = changeOrders.filter(co => co.status === 'approved').length;
      
      // Calcular totales
      const paidInvoices = invoices.filter(i => i.status === 'paid');
      console.log('💰 Paid invoices found:', {
        totalInvoices: invoices.length,
        paidInvoices: paidInvoices.length,
        paidInvoicesData: paidInvoices.map(inv => ({
          id: inv.id,
          number: inv.invoiceNumber,
          total: inv.total,
          status: inv.status,
          paidDate: inv.paidDate
        }))
      });
      
      const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
      
      const monthlyRevenue = invoices
        .filter(i => i.status === 'paid' && 
          new Date(i.paidDate || i.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, invoice) => sum + invoice.total, 0);
      
      const totalCosts = projects.reduce((sum, project) => sum + project.actualCost, 0);
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;
      
      console.log('📈 Final calculations:', {
        totalRevenue,
        monthlyRevenue,
        paidInvoicesCount: paidInvoices.length,
        pendingInvoices,
        totalCosts,
        profitMargin
      });
      
      setReportData({
        totalProjects: projects.length,
        activeProjects,
        completedProjects,
        totalRevenue,
        pendingInvoices,
        paidInvoices: paidInvoices.length,
        changeOrders: changeOrders.length,
        approvedChangeOrders,
        monthlyRevenue,
        profitMargin
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de reportes
  useEffect(() => {
    loadReportData();
  }, [user, profile?.userId]);

  // Función para refrescar datos
  const handleRefresh = async () => {
    if (!user || !profile?.userId) return;
    
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing report data...');
      await loadReportData();
      toast.success('Datos de reportes actualizados');
    } catch (error) {
      console.error('Error refreshing report data:', error);
      toast.error('Error al actualizar los datos');
    } finally {
      setRefreshing(false);
    }
  };

  // Función para descargar PDF
  const handleDownloadPdf = async () => {
    if (!reportData) return;
    
    try {
      setIsGeneratingPdf(true);
      const filename = `reporte-${new Date().toISOString().split('T')[0]}.pdf`;
      await generatePdf('reports-container', filename);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Función para descargar Excel
  const handleDownloadExcel = async () => {
    if (!reportData) return;
    
    try {
      setIsGeneratingExcel(true);
      const filename = `reporte-${new Date().toISOString().split('T')[0]}.xlsx`;
      await generateExcel(reportData, filename);
      toast.success('Excel generado exitosamente');
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Error al generar el Excel');
    } finally {
      setIsGeneratingExcel(false);
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

  if (!reportData) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">No se pudieron cargar los datos de reportes</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div id="reports-container" className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('navigation.reports') || 'Reportes y Analytics'}</h1>
            <p className="mt-1 text-sm text-gray-500">
                {t('analyzePerformance') || 'Analiza el rendimiento de tus proyectos y la rentabilidad'}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? (t('common.updating') || 'Actualizando...') : (t('common.refresh') || 'Actualizar')}
              </button>
              
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-print"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">{t('last30Days') || 'Últimos 30 días'}</option>
                <option value="90d">Últimos 90 días</option>
                <option value="1y">Último año</option>
              </select>
              
              {/* Botones de descarga */}
              <div className="flex space-x-2 no-print">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  {isGeneratingPdf ? 'Generando...' : 'PDF'}
                </button>
                
                <button
                  onClick={handleDownloadExcel}
                  disabled={isGeneratingExcel}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  {isGeneratingExcel ? 'Generando...' : 'Excel'}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Revenue */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('totalRevenue') || 'Ingresos Totales'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(reportData.totalRevenue)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Projects */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('activeProjects') || 'Proyectos Activos'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {reportData.activeProjects}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Projects */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('completedProjects') || 'Proyectos Completados'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {reportData.completedProjects}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Margin */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('profitMargin') || 'Margen de Ganancia'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {reportData.profitMargin.toFixed(1)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Financial Overview */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {t('financialSummary') || 'Resumen Financiero'}
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('monthlyRevenue') || 'Ingresos del Mes'}</dt>
                    <dd className="mt-1 text-sm font-semibold text-green-600">
                      {formatCurrency(reportData.monthlyRevenue)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('paidInvoices') || 'Facturas Pagadas'}</dt>
                    <dd className="mt-1 text-sm font-semibold text-blue-600">
                      {reportData.paidInvoices}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('pendingInvoices') || 'Facturas Pendientes'}</dt>
                    <dd className="mt-1 text-sm font-semibold text-yellow-600">
                      {reportData.pendingInvoices}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('totalProjects') || 'Total Proyectos'}</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900">
                      {reportData.totalProjects}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Change Orders Overview */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {t('changeOrders') || 'Órdenes de Cambio'}
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('totalOrders') || 'Total Órdenes'}</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900">
                      {reportData.changeOrders}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('approved') || 'Aprobadas'}</dt>
                    <dd className="mt-1 text-sm font-semibold text-green-600">
                      {reportData.approvedChangeOrders}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('approvalRate') || 'Tasa de Aprobación'}</dt>
                    <dd className="mt-1 text-sm font-semibold text-blue-600">
                      {reportData.changeOrders > 0 
                        ? ((reportData.approvedChangeOrders / reportData.changeOrders) * 100).toFixed(1)
                        : 0}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('pending') || 'Pendientes'}</dt>
                    <dd className="mt-1 text-sm font-semibold text-yellow-600">
                      {reportData.changeOrders - reportData.approvedChangeOrders}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {t('performanceIndicators') || 'Indicadores de Rendimiento'}
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.totalProjects > 0 
                      ? ((reportData.completedProjects / reportData.totalProjects) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-500">{t('completionRate') || 'Tasa de Finalización'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.paidInvoices + reportData.pendingInvoices > 0
                      ? ((reportData.paidInvoices / (reportData.paidInvoices + reportData.pendingInvoices)) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-500">{t('collectionRate') || 'Tasa de Cobro'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {reportData.changeOrders > 0
                      ? ((reportData.approvedChangeOrders / reportData.changeOrders) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-500">{t('changeApproval') || 'Aprobación de Cambios'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
