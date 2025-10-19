import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha inválida';
  }
}

export function formatShortDate(date: Date | string): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting short date:', error);
    return 'Fecha inválida';
  }
}

export function generateProjectNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PROJ-${year}${month}-${random}`;
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
}

export function generateEstimateNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `EST-${year}${month}-${random}`;
}

export function calculateInvoiceTotals(items: any[], taxRate: number = 6.625) {
  const subtotal = items.reduce((sum, item) => {
    // Usar item.total si existe, sino calcular quantity * unitPrice
    const itemTotal = item.total !== undefined ? item.total : (item.quantity * item.unitPrice);
    return sum + (itemTotal || 0);
  }, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    taxRate
  };
}

export function getInvoiceStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'sent':
      return 'bg-blue-100 text-blue-800';
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getInvoiceStatusText(status: string): string {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'sent':
      return 'Enviada';
    case 'paid':
      return 'Pagada';
    case 'overdue':
      return 'Vencida';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
}

export function isInvoiceOverdue(dueDate: Date): boolean {
  return new Date() > new Date(dueDate);
}

export function calculateDaysOverdue(dueDate: Date): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
