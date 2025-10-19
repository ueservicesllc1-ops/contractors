'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CompanyProfile, ProfileSetupData } from '@/types/profile';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  profile: CompanyProfile | null;
  loading: boolean;
  isProfileComplete: boolean;
  isPremium: boolean;
  subscriptionType: 'free' | 'premium' | 'enterprise';
  updateProfile: (data: ProfileSetupData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isProfileComplete = profile?.isComplete === true;
  const isPremium = profile?.isPremium || false;
  const subscriptionType = profile?.subscriptionType || 'free';
  
  // Debug: Log cuando cambie el estado del perfil
  useEffect(() => {
    console.log('🔍 Profile state changed:', {
      profile: profile,
      isComplete: profile?.isComplete,
      isProfileComplete: isProfileComplete,
      isPremium: isPremium,
      subscriptionType: subscriptionType,
      loading: loading,
      userId: user?.id
    });
  }, [profile, isProfileComplete, isPremium, subscriptionType, loading, user?.id]);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true); // Asegurar que loading esté en true al empezar
    
    try {
      const profileDoc = await getDoc(doc(db, 'company_profiles', user.id));
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        console.log('Profile found in Firestore:', profileData);
        const profileObj = {
          id: profileDoc.id,
          userId: user.id,
          ...profileData,
          createdAt: profileData.createdAt?.toDate() || new Date(),
          updatedAt: profileData.updatedAt?.toDate() || new Date(),
          liabilityInsurance: profileData.liabilityInsurance ? {
            ...profileData.liabilityInsurance,
            expiryDate: profileData.liabilityInsurance.expiryDate?.toDate() || new Date(),
          } : undefined,
          njLicenseExpiry: profileData.njLicenseExpiry?.toDate() || undefined,
        } as CompanyProfile;
        
        setProfile(profileObj);
        console.log('Profile set in state:', profileObj);
      } else {
        console.log('No profile found in Firestore for user:', user.id);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
      console.log('Profile loading finished');
    }
  };

  const updateProfile = async (data: ProfileSetupData) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const profileData: CompanyProfile = {
        id: user.id,
        userId: user.id,
        type: data.type,
        companyName: data.companyName,
        companyType: data.companyType,
        businessLicense: data.businessLicense,
        ein: data.ein,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        specialties: data.specialties,
        yearsInBusiness: data.yearsInBusiness,
        teamSize: data.teamSize,
        liabilityInsurance: data.liabilityInsurance ? {
          ...data.liabilityInsurance,
          expiryDate: new Date(data.liabilityInsurance.expiryDate),
        } : undefined,
        njContractorLicense: data.njContractorLicense,
        njLicenseType: data.njLicenseType,
        njLicenseExpiry: data.njLicenseExpiry ? new Date(data.njLicenseExpiry) : undefined,
        isComplete: true,
        profileCompletionDate: new Date(),
        createdAt: profile?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'company_profiles', user.id), {
        ...profileData,
        createdAt: profileData.createdAt,
        updatedAt: profileData.updatedAt,
        profileCompletionDate: profileData.profileCompletionDate,
        liabilityInsurance: profileData.liabilityInsurance ? {
          ...profileData.liabilityInsurance,
          expiryDate: profileData.liabilityInsurance.expiryDate,
        } : undefined,
        njLicenseExpiry: profileData.njLicenseExpiry,
      });

      setProfile(profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    setLoading(true);
    await fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const value = {
    profile,
    loading,
    isProfileComplete,
    isPremium,
    subscriptionType,
    updateProfile,
    refreshProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
