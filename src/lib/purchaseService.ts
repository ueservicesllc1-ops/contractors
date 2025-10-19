import { db } from './firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

export interface Purchase {
  id: string;
  supplier: string;
  invoiceNumber?: string;
  purchaseDate: Date;
  amount: number;
  projectId?: string;
  projectName?: string;
  category: 'materials' | 'equipment' | 'labor' | 'permits' | 'other';
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PurchaseService {
  private static collectionName = 'purchases';

  // Crear una nueva compra
  static async createPurchase(purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    try {
      const purchaseData = {
        supplier: purchase.supplier,
        invoiceNumber: purchase.invoiceNumber || '',
        purchaseDate: purchase.purchaseDate,
        amount: purchase.amount,
        projectId: purchase.projectId || '',
        projectName: purchase.projectName || '',
        category: purchase.category,
        description: purchase.description || '',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), purchaseData);
      console.log('Purchase created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  }

  // Obtener todas las compras de un usuario
  static async getUserPurchases(userId: string): Promise<Purchase[]> {
    try {
      console.log('📋 ===== GET PURCHASES START =====');
      console.log('📋 Firebase Project ID:', db.app.options.projectId);
      console.log('📋 Collection name:', this.collectionName);
      console.log('📋 User ID:', userId);
      
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const purchases: Purchase[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        purchases.push({
          id: doc.id,
          ...data,
          purchaseDate: data.purchaseDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Purchase);
      });
      
      console.log('📋 Total purchases found:', purchases.length);
      console.log('📋 Purchase IDs:', purchases.map(p => p.id));
      
      return purchases;
    } catch (error) {
      console.error('Error getting user purchases:', error);
      throw error;
    }
  }

  // Obtener una compra por ID
  static async getPurchase(purchaseId: string): Promise<Purchase | null> {
    try {
      const docRef = doc(db, this.collectionName, purchaseId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          purchaseDate: data.purchaseDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Purchase;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting purchase:', error);
      throw error;
    }
  }

  // Actualizar una compra
  static async updatePurchase(purchaseId: string, purchase: Partial<Purchase>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, purchaseId);
      await updateDoc(docRef, {
        ...purchase,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating purchase:', error);
      throw error;
    }
  }

  // Eliminar una compra
  static async deletePurchase(purchaseId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, purchaseId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting purchase:', error);
      throw error;
    }
  }
}
