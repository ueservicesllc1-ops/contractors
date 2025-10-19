'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import StatsCards from '@/components/dashboard/StatsCards';
import RecentProjects from '@/components/dashboard/RecentProjects';
import QuickActions from '@/components/dashboard/QuickActions';
import InvoiceStats from '@/components/dashboard/InvoiceStats';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ThemeTest from '@/components/ThemeTest';
import ThemeDebug from '@/components/ThemeDebug';
import { ProjectService } from '@/lib/projectService';
import { InvoiceService } from '@/lib/invoiceService';
import { EstimateService } from '@/lib/estimateService';
import { Project, Invoice, Estimate } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentEstimates, setRecentEstimates] = useState<Estimate[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user || !profile?.userId) return;

      try {
        setLoading(true);
        
        // Cargar proyectos
        const projects = await ProjectService.getUserProjects(profile.userId);
        setRecentProjects(projects.slice(0, 3)); // Solo los 3 más recientes
        
        // Cargar facturas
        const invoices = await InvoiceService.getUserInvoices(profile.userId);
        setRecentInvoices(invoices.slice(0, 3)); // Solo las 3 más recientes
        
        // Cargar estimados
        const estimates = await EstimateService.getUserEstimates(profile.userId);
        setRecentEstimates(estimates.slice(0, 3)); // Solo los 3 más recientes
        
        // Calcular estadísticas
        const activeProjects = projects.filter(p => p.status === 'active').length;
        const totalRevenue = invoices
          .filter(i => i.status === 'paid')
          .reduce((sum, invoice) => sum + invoice.total, 0);
        const pendingInvoices = invoices.filter(i => i.status === 'sent').length;
        
        setStats({
          totalProjects: projects.length,
          activeProjects,
          totalRevenue,
          pendingInvoices,
        });
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, profile?.userId]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando dashboard...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Theme Debug - Temporary */}
          <ThemeDebug />
          
          {/* Theme Test - Temporary */}
          <ThemeTest />
          
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.description') || 'Resumen general de tus proyectos y actividades'}
            </p>
          </div>

          {/* Stats cards */}
          <StatsCards stats={stats} />

          {/* Main content grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent projects */}
            <div className="lg:col-span-1">
              <RecentProjects projects={recentProjects} />
            </div>

            {/* Quick actions */}
            <div className="lg:col-span-1">
              <QuickActions />
            </div>
          </div>

          {/* Invoice Stats */}
          <InvoiceStats />

          {/* Additional dashboard content can go here */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Bienvenido a ContractorApp
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>
                  Tu sistema integral de gestión para contratistas está listo para usar.
                </p>
                <p>
                  Desde aquí puedes gestionar proyectos, crear presupuestos, generar facturas
                  y mantener un control completo de tus operaciones de construcción.
                </p>
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Próximos pasos:</h4>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Agrega tus primeros clientes</li>
                    <li>Crea un nuevo proyecto</li>
                    <li>Genera tu primer presupuesto</li>
                    <li>Configura tu perfil de empresa</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
