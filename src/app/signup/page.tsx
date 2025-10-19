'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SignupForm from '@/components/auth/SignupForm';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <BuildingOfficeIcon className="mx-auto h-16 w-16 text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            ContractorApp
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de gestión profesional para contratistas
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
