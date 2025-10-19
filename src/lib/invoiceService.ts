import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Invoice, Payment } from '@/types';

const INVOICES_COLLECTION = 'invoices';
const PAYMENTS_COLLECTION = 'payments';

export class InvoiceService {
  // Crear una nueva factura
  static async createInvoice(userId: string, invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, INVOICES_COLLECTION), {
        ...invoiceData,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        issueDate: Timestamp.fromDate(invoiceData.issueDate),
        dueDate: Timestamp.fromDate(invoiceData.dueDate),
        sentAt: invoiceData.sentAt ? Timestamp.fromDate(invoiceData.sentAt) : null,
        paidDate: invoiceData.paidDate ? Timestamp.fromDate(invoiceData.paidDate) : null,
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Obtener todas las facturas de un usuario
  static async getUserInvoices(userId: string): Promise<Invoice[]> {
    try {
      const q = query(
        collection(db, INVOICES_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const invoices: Invoice[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        invoices.push({
          id: doc.id,
          ...data,
          issueDate: data.issueDate.toDate(),
          dueDate: data.dueDate.toDate(),
          sentAt: data.sentAt ? data.sentAt.toDate() : undefined,
          paidDate: data.paidDate ? data.paidDate.toDate() : undefined,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Invoice);
      });
      
      return invoices;
    } catch (error) {
      console.error('Error getting user invoices:', error);
      throw error;
    }
  }

  // Obtener una factura específica
  static async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          issueDate: data.issueDate.toDate(),
          dueDate: data.dueDate.toDate(),
          sentAt: data.sentAt ? data.sentAt.toDate() : undefined,
          paidDate: data.paidDate ? data.paidDate.toDate() : undefined,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Invoice;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    }
  }

  // Actualizar una factura
  static async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<void> {
    try {
      const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
      
      // Filtrar campos undefined
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const updateData: any = {
        ...filteredUpdates,
        updatedAt: Timestamp.now(),
      };
      
      // Recalcular balance si se actualiza el total o amountPaid
      if (updates.total !== undefined || updates.amountPaid !== undefined) {
        const total = updates.total || 0;
        const amountPaid = updates.amountPaid || 0;
        updateData.balance = Math.max(0, total - amountPaid);
        console.log('Recalculating balance:', { total, amountPaid, balance: updateData.balance });
      }
      
      // Convertir fechas a Timestamp si existen
      if (updates.issueDate) updateData.issueDate = Timestamp.fromDate(updates.issueDate);
      if (updates.dueDate) updateData.dueDate = Timestamp.fromDate(updates.dueDate);
      if (updates.sentAt) updateData.sentAt = Timestamp.fromDate(updates.sentAt);
      if (updates.paidDate) updateData.paidDate = Timestamp.fromDate(updates.paidDate);
      
      console.log('Updating invoice with data:', updateData);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  // Eliminar una factura
  static async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // Agregar un pago a una factura
  static async addPayment(userId: string, invoiceId: string, paymentData: Omit<Payment, 'id' | 'invoiceId' | 'createdAt'>): Promise<string> {
    try {
      const paymentRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
        ...paymentData,
        invoiceId,
        userId,
        paymentDate: Timestamp.fromDate(paymentData.paymentDate),
        createdAt: Timestamp.now(),
      });

      // Actualizar el balance de la factura
      const invoice = await this.getInvoice(invoiceId);
      if (invoice) {
        const newPaidAmount = invoice.amountPaid + paymentData.amount;
        const newBalance = invoice.total - newPaidAmount;
        
        await this.updateInvoice(invoiceId, {
          amountPaid: newPaidAmount,
          balance: newBalance,
          status: newBalance <= 0 ? 'paid' : 'sent',
          paidDate: newBalance <= 0 ? new Date() : invoice.paidDate,
        });
      }

      return paymentRef.id;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  }

  // Obtener pagos de una factura
  static async getInvoicePayments(invoiceId: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        where('invoiceId', '==', invoiceId),
        orderBy('paymentDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const payments: Payment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          invoiceId,
          ...data,
          paymentDate: data.paymentDate.toDate(),
          createdAt: data.createdAt.toDate(),
        } as Payment);
      });
      
      return payments;
    } catch (error) {
      console.error('Error getting invoice payments:', error);
      throw error;
    }
  }

  // Marcar factura como pagada
  static async markInvoiceAsPaid(invoiceId: string): Promise<void> {
    try {
      console.log('💰 Marking invoice as paid:', invoiceId);
      const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
      
      // Obtener la factura actual para obtener el total
      const currentInvoice = await this.getInvoice(invoiceId);
      if (!currentInvoice) {
        throw new Error('Invoice not found');
      }
      
      console.log('📄 Current invoice data:', {
        id: currentInvoice.id,
        number: currentInvoice.invoiceNumber,
        total: currentInvoice.total,
        currentStatus: currentInvoice.status
      });
      
      await updateDoc(docRef, {
        status: 'paid',
        paidDate: Timestamp.now(),
        amountPaid: currentInvoice.total,
        balance: 0,
        updatedAt: Timestamp.now(),
      });
      
      console.log('✅ Invoice marked as paid successfully');
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  }

  // Obtener estadísticas de facturación
  static async getInvoiceStats(userId: string) {
    try {
      const invoices = await this.getUserInvoices(userId);
      
      const stats = {
        totalInvoices: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
        pendingAmount: invoices
          .filter(inv => inv.status === 'sent')
          .reduce((sum, inv) => sum + inv.balance, 0),
        overdueAmount: invoices
          .filter(inv => inv.status === 'overdue' || (inv.status === 'sent' && new Date() > inv.dueDate))
          .reduce((sum, inv) => sum + inv.balance, 0),
        paidThisMonth: invoices
          .filter(inv => inv.status === 'paid' && inv.paidDate && 
            inv.paidDate.getMonth() === new Date().getMonth() && 
            inv.paidDate.getFullYear() === new Date().getFullYear())
          .reduce((sum, inv) => sum + inv.total, 0),
        overdueCount: invoices.filter(inv => inv.status === 'overdue' || (inv.status === 'sent' && new Date() > inv.dueDate)).length,
        pendingCount: invoices.filter(inv => inv.status === 'sent').length,
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting invoice stats:', error);
      throw error;
    }
  }
}
