export interface CompanyProfile {
  id: string;
  userId: string;
  type: 'company' | 'independent_contractor';
  
  // Company Information
  companyName?: string;
  companyType?: 'LLC' | 'Corporation' | 'Partnership' | 'Sole Proprietorship';
  businessLicense?: string;
  ein?: string; // Employer Identification Number
  
  // Contact Information
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Professional Information
  specialties?: string[];
  yearsInBusiness?: number;
  teamSize?: number;
  
  // Insurance Information
  liabilityInsurance?: {
    provider: string;
    policyNumber: string;
    coverageAmount: number;
    expiryDate: Date;
  };
  
  // New Jersey Specific
  njContractorLicense?: string;
  njLicenseType?: string;
  njLicenseExpiry?: Date;
  
  // Profile Completion
  isComplete: boolean;
  profileCompletionDate?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileSetupData {
  type: 'company' | 'independent_contractor';
  companyName?: string;
  companyType?: 'LLC' | 'Corporation' | 'Partnership' | 'Sole Proprietorship';
  businessLicense?: string;
  ein?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  specialties?: string[];
  yearsInBusiness?: number;
  teamSize?: number;
  liabilityInsurance?: {
    provider: string;
    policyNumber: string;
    coverageAmount: number;
    expiryDate: string;
  };
  njContractorLicense?: string;
  njLicenseType?: string;
  njLicenseExpiry?: string;
}
