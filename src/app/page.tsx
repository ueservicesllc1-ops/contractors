'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { isProfileComplete, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log('Page useEffect triggered:', {
      authLoading,
      profileLoading,
      user: user?.id,
      isProfileComplete,
      willRedirect: !authLoading && !profileLoading
    });
    
    // Solo redirigir cuando tanto auth como profile hayan terminado de cargar
    if (!authLoading && !profileLoading) {
      setIsRedirecting(true);
      if (!user) {
        console.log('Redirecting to login - no user');
        router.push('/login');
      } else if (user && isProfileComplete) {
        console.log('Redirecting to dashboard - profile complete');
        router.push('/dashboard');
      } else if (user && !isProfileComplete) {
        console.log('Redirecting to config - profile not complete');
        router.push('/config');
      }
    }
  }, [user, isProfileComplete, authLoading, profileLoading, router]);

  // Siempre mostrar algo, nunca null
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <BuildingOfficeIcon className="mx-auto h-16 w-16 text-blue-600 animate-pulse" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          ContractorApp
        </h1>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        <p className="mt-2 text-gray-600">
          {authLoading || profileLoading 
            ? 'Verificando configuración...' 
            : isRedirecting 
              ? 'Redirigiendo...' 
              : 'Cargando...'}
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Auth Loading: {authLoading ? 'Sí' : 'No'}</p>
          <p>Profile Loading: {profileLoading ? 'Sí' : 'No'}</p>
          <p>User: {user ? 'Logueado' : 'No logueado'}</p>
          <p>Profile Complete: {isProfileComplete ? 'Sí' : 'No'}</p>
          <p>User ID: {user?.id || 'N/A'}</p>
          <p>User Email: {user?.email || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}