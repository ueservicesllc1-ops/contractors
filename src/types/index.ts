export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'contractor' | 'employee';
  company?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  projectNumber: string;
  name: string;
  clientId: string;
  client?: Client;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  estimatedCost: number;
  actualCost: number;
  phases: ProjectPhase[];
  teamMembers: string[];
  files: ProjectFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  startDate?: Date;
  endDate?: Date;
  estimatedCost: number;
  actualCost: number;
  order: number;
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'drawing' | 'other';
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Estimate {
  id: string;
  projectId: string;
  clientId: string;
  estimateNumber: string;
  name: string;
  description?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  sections: EstimateSection[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  validUntil: Date;
  terms?: string;
  notes?: string;
  // Datos completos del cliente
  clientName?: string;
  clientAddress?: string;
  clientEmail?: string;
  clientPhone?: string;
  // Datos completos del proyecto
  projectName?: string;
  projectAddress?: string;
  // New Jersey specific fields
  contractorLicense?: string;
  contractorName?: string;
  contractorAddress?: string;
  contractorPhone?: string;
  contractorEmail?: string;
  // Legal compliance
  cancellationRights?: string;
  warrantyInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: 'materials' | 'equipment' | 'labor';
  margin: number;
  notes?: string;
  brand?: string;
  model?: string;
  supplier?: string;
  leadTime?: number; // days
  wasteFactor?: number; // percentage
}

export interface EstimateSection {
  id: string;
  name: string;
  description?: string;
  items: EstimateItem[];
  subtotal: number;
  order: number;
}

export interface EstimateTemplate {
  id: string;
  name: string;
  description?: string;
  sections: EstimateSection[];
  defaultMarkup: number;
  defaultLaborRate: number;
  defaultMaterialMarkup: number;
  defaultEquipmentMarkup: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNumber: string;
  clientId: string;
  estimateId?: string; // Optional reference to estimate
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  type: 'progress' | 'final' | 'change_order' | 'retainer';
  
  // Invoice Details
  issueDate: Date;
  dueDate: Date;
  paymentTerms: string;
  
  // Line Items
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  
  // Progress Billing (for progress invoices)
  progressBilling?: {
    phase: string;
    percentage: number;
    amount: number;
  };
  
  // Payment Information
  payments: Payment[];
  amountPaid: number;
  balance: number;
  
  // Client Information
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone?: string;
  
  // Contractor Information
  contractorName: string;
  contractorAddress: string;
  contractorPhone: string;
  contractorEmail: string;
  contractorLicense?: string;
  
  // Additional Information
  notes?: string;
  terms?: string;
  lateFeeRate?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  paidDate?: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: 'labor' | 'materials' | 'equipment' | 'subcontractor' | 'other';
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  reference?: string;
  notes?: string;
  createdAt: Date;
}

export interface Purchase {
  id: string;
  projectId?: string;
  vendor: string;
  description: string;
  amount: number;
  billable: boolean;
  status: 'pending' | 'paid';
  invoiceNumber?: string;
  purchaseDate: Date;
  dueDate?: Date;
  paidDate?: Date;
  files: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangeOrder {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  changeOrderNumber: string;
  title: string;
  description: string;
  reason: string;
  originalAmount: number;
  changeAmount: number;
  newTotalAmount: number;
  impactOnSchedule: string;
  status: 'pending' | 'approved' | 'declined' | 'expired';
  approvalToken: string;
  clientResponse?: 'approved' | 'declined';
  clientResponseDate?: Date | null;
  clientResponseNotes?: string;
  expiresAt: Date;
  items: ChangeOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangeOrderItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  type: 'addition' | 'deletion' | 'modification';
  category: 'materials' | 'equipment' | 'labor' | 'permits' | 'other';
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  monthlyRevenue: number;
  profitMargin: number;
}
