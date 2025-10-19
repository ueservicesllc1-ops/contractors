'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  StarIcon,
  UserIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  isPremium: boolean;
  subscriptionType: 'free' | 'premium' | 'enterprise';
  createdAt: Date;
  lastLogin: Date;
  totalProjects: number;
  totalInvoices: number;
  totalRevenue: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'premium' | 'free'>('all');

  // Mock data - En producción esto vendría de una API de admin
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'john@contractor.com',
      name: 'John Smith',
      companyName: 'Smith Construction',
      isPremium: true,
      subscriptionType: 'premium',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date('2024-10-19'),
      totalProjects: 12,
      totalInvoices: 45,
      totalRevenue: 125000
    },
    {
      id: '2',
      email: 'maria@builders.com',
      name: 'Maria Garcia',
      companyName: 'Garcia Builders',
      isPremium: false,
      subscriptionType: 'free',
      createdAt: new Date('2024-03-20'),
      lastLogin: new Date('2024-10-18'),
      totalProjects: 5,
      totalInvoices: 18,
      totalRevenue: 45000
    },
    {
      id: '3',
      email: 'mike@construct.com',
      name: 'Mike Johnson',
      companyName: 'Johnson Construction',
      isPremium: true,
      subscriptionType: 'enterprise',
      createdAt: new Date('2024-02-10'),
      lastLogin: new Date('2024-10-19'),
      totalProjects: 25,
      totalInvoices: 89,
      totalRevenue: 350000
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'premium' && user.isPremium) ||
                         (filterType === 'free' && !user.isPremium);
    
    return matchesSearch && matchesFilter;
  });

  const handleUpgradeUser = (userId: string, subscriptionType: 'premium' | 'enterprise') => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isPremium: true, subscriptionType }
        : user
    ));
    toast.success(`Usuario actualizado a ${subscriptionType}`);
  };

  const handleDowngradeUser = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isPremium: false, subscriptionType: 'free' }
        : user
    ));
    toast.success('Usuario degradado a plan gratuito');
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setUsers(users.filter(user => user.id !== userId));
      toast.success('Usuario eliminado');
    }
  };

  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter(u => u.isPremium).length,
    freeUsers: users.filter(u => !u.isPremium).length,
    totalRevenue: users.reduce((sum, user) => sum + user.totalRevenue, 0)
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando panel de administración...</p>
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
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Panel de Administración
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gestiona usuarios, suscripciones y configuraciones del sistema
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
              <ShieldCheckIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Super Admin</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Total Usuarios
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {stats.totalUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <StarIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Usuarios Premium
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {stats.premiumUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Usuarios Gratuitos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {stats.freeUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Ingresos Totales
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        ${stats.totalRevenue.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Buscar usuarios
                </label>
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="sm:w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filtrar por tipo
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="premium">Premium</option>
                  <option value="free">Gratuitos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                Gestión de Usuarios
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Administra usuarios y sus suscripciones
              </p>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <li key={user.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.name}
                          </p>
                          {user.isPremium && (
                            <StarIcon className="ml-2 h-4 w-4 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.companyName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.subscriptionType === 'free' ? 'Gratuito' : 
                           user.subscriptionType === 'premium' ? 'Premium' : 'Enterprise'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.totalProjects} proyectos • ${user.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!user.isPremium ? (
                          <>
                            <button
                              onClick={() => handleUpgradeUser(user.id, 'premium')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                            >
                              <StarIcon className="h-3 w-3 mr-1" />
                              Premium
                            </button>
                            <button
                              onClick={() => handleUpgradeUser(user.id, 'enterprise')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
                            >
                              Enterprise
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDowngradeUser(user.id)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <XMarkIcon className="h-3 w-3 mr-1" />
                            Degradar
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Ver
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* User Detail Modal */}
          {showUserModal && selectedUser && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Detalles del Usuario
                    </h3>
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedUser.name}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedUser.email}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Empresa
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedUser.companyName}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Suscripción
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedUser.subscriptionType === 'free' ? 'Gratuito' : 
                         selectedUser.subscriptionType === 'premium' ? 'Premium' : 'Enterprise'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Proyectos
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.totalProjects}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Facturas
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.totalInvoices}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ingresos Totales
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        ${selectedUser.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
