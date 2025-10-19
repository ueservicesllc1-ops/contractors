'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { ShoppingCartIcon, PlusIcon, MagnifyingGlassIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PurchaseService, Purchase } from '@/lib/purchaseService';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const getCategoryLabels = (t: (key: string) => string) => ({
  materials: t('purchase.category.materials') || 'Materiales',
  equipment: t('purchase.category.equipment') || 'Equipos',
  labor: t('purchase.category.labor') || 'Mano de Obra',
  permits: t('purchase.category.permits') || 'Permisos',
  other: t('purchase.category.other') || 'Otros',
});

export default function PurchasesPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const categoryLabels = getCategoryLabels(t);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar compras del usuario
  useEffect(() => {
    const loadPurchases = async () => {
      if (!user || !profile?.userId) return;
      
      try {
        setLoading(true);
        const userPurchases = await PurchaseService.getUserPurchases(profile.userId);
        setPurchases(userPurchases);
      } catch (error) {
        console.error('Error loading purchases:', error);
        toast.error('Error al cargar las compras');
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();
  }, [user, profile?.userId]);

  const filteredPurchases = purchases.filter(purchase =>
    purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (purchaseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta compra?')) {
      return;
    }

    try {
      await PurchaseService.deletePurchase(purchaseId);
      setPurchases(prev => prev.filter(p => p.id !== purchaseId));
      toast.success('Compra eliminada');
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Error al eliminar la compra');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando compras...</p>
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
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('navigation.purchases') || 'Compras y Gastos'}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('purchases.managePurchases') || 'Registra y gestiona tus compras y gastos del proyecto'}
              </p>
            </div>
            <Link
              href="/purchases/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('purchases.newPurchase') || 'Nueva Compra'}
            </Link>
          </div>

          {/* Search */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('purchases.searchPlaceholder') || 'Buscar compras...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Purchases list */}
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchTerm ? (t('purchases.noResults') || 'No se encontraron compras') : (t('purchases.noPurchases') || 'No hay compras registradas')}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm
                  ? (t('purchases.tryOtherTerms') || 'Intenta con otros términos de búsqueda.')
                  : (t('purchases.startRecording') || 'Comienza registrando tu primera compra.')}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Link
                    href="/purchases/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {t('purchases.newPurchase') || 'Nueva Compra'}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <li key={purchase.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900">
                            {purchase.supplier}
                          </h3>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(purchase.amount)}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatDate(purchase.purchaseDate)}</span>
                          <span>•</span>
                          <span>{categoryLabels[purchase.category]}</span>
                          {purchase.projectName && (
                            <>
                              <span>•</span>
                              <span>{purchase.projectName}</span>
                            </>
                          )}
                        </div>
                        {purchase.description && (
                          <p className="mt-2 text-sm text-gray-600">
                            {purchase.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
