import { db } from './firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { ChangeOrder } from '@/types';
import { ProjectService } from './projectService';

export class ChangeOrderService {
  private static collectionName = 'changeOrders';


  // Generar token único para aprobación
  private static generateApprovalToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Generar número de Change Order
  private static generateChangeOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CO-${year}${month}${day}-${random}`;
  }

  // Crear un nuevo Change Order
  static async createChangeOrder(changeOrder: Omit<ChangeOrder, 'id' | 'createdAt' | 'updatedAt' | 'changeOrderNumber' | 'approvalToken' | 'status'>, userId: string): Promise<string> {
    try {
      const approvalToken = this.generateApprovalToken();
      const changeOrderNumber = this.generateChangeOrderNumber();
      
      // Calcular fechas de expiración (7 días por defecto)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const changeOrderData = {
        ...changeOrder,
        userId,
        changeOrderNumber,
        approvalToken,
        status: 'pending' as const,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), changeOrderData);
      console.log('Change Order created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating change order:', error);
      throw error;
    }
  }

  // Obtener todos los Change Orders de un usuario
  static async getUserChangeOrders(userId: string): Promise<ChangeOrder[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const changeOrders: ChangeOrder[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const changeOrder = {
          id: doc.id,
          ...data,
          expiresAt: data.expiresAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          clientResponseDate: data.clientResponseDate ? new Date(data.clientResponseDate) : null,
        } as ChangeOrder;
        
        changeOrders.push(changeOrder);
      });
      
      return changeOrders;
    } catch (error) {
      console.error('Error getting user change orders:', error);
      throw error;
    }
  }

  // Obtener Change Order por token de aprobación (para clientes)
  static async getChangeOrderByToken(token: string): Promise<ChangeOrder | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('approvalToken', '==', token)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        expiresAt: data.expiresAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        clientResponseDate: data.clientResponseDate ? new Date(data.clientResponseDate) : null,
      } as ChangeOrder;
    } catch (error) {
      console.error('Error getting change order by token:', error);
      throw error;
    }
  }

  // Responder a un Change Order (cliente)
  static async respondToChangeOrder(token: string, response: 'approved' | 'declined', notes?: string): Promise<void> {
    try {
      console.log('📝 ===== RESPOND TO CHANGE ORDER START =====');
      console.log('📝 Token:', token);
      console.log('📝 Response:', response);
      console.log('📝 Notes:', notes);
      
      const changeOrder = await this.getChangeOrderByToken(token);
      
      if (!changeOrder) {
        throw new Error('Change order not found');
      }
      
      // Verificar si ya expiró
      if (new Date() > changeOrder.expiresAt) {
        throw new Error('Change order has expired');
      }
      
      // Verificar si ya fue respondido
      if (changeOrder.clientResponse) {
        throw new Error('Change order has already been responded to');
      }
      
      const docRef = doc(db, this.collectionName, changeOrder.id);
      
      const responseDate = new Date();
      console.log('📝 Setting clientResponseDate to:', responseDate);
      console.log('📝 Response date timestamp:', responseDate.getTime());
      
      const updateData = {
        clientResponse: response,
        clientResponseDate: Timestamp.fromDate(responseDate),
        clientResponseNotes: notes || '',
        status: response === 'approved' ? 'approved' : 'declined',
        updatedAt: new Date(),
        // Forzar que se guarden todos los campos
        userId: changeOrder.userId,
        projectId: changeOrder.projectId,
        approvalToken: changeOrder.approvalToken,
      };
      
      console.log('📝 Update data being sent:', updateData);
      console.log('📝 Update data keys:', Object.keys(updateData));
      
      await updateDoc(docRef, updateData);
      
      console.log('✅ Change order response saved successfully');
      
      // Verificar que se guardó correctamente
      const updatedDoc = await getDoc(docRef);
      const updatedData = updatedDoc.data();
      console.log('📝 Verification - Updated clientResponseDate:', updatedData?.clientResponseDate);
      console.log('📝 Verification - Updated clientResponse:', updatedData?.clientResponse);
      
      // Si fue aprobado, actualizar el proyecto con el nuevo monto
      if (response === 'approved') {
        try {
          const project = await ProjectService.getProject(changeOrder.projectId);
          if (project) {
            const newEstimatedCost = project.estimatedCost + changeOrder.changeAmount;
            await ProjectService.updateProject(changeOrder.projectId, {
              estimatedCost: newEstimatedCost,
            });
            console.log('✅ Project updated with new estimated cost:', newEstimatedCost);
          }
        } catch (error) {
          console.error('❌ Error updating project:', error);
          // No lanzamos el error para no afectar la respuesta del cliente
        }
      }
      
      console.log('✅ Change order response recorded successfully');
      console.log('✅ ===== RESPOND COMPLETE =====');
    } catch (error) {
      console.error('❌ Error responding to change order:', error);
      throw error;
    }
  }

  // Actualizar Change Order
  static async updateChangeOrder(changeOrderId: string, updates: Partial<ChangeOrder>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, changeOrderId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating change order:', error);
      throw error;
    }
  }

  // Eliminar Change Order
  static async deleteChangeOrder(changeOrderId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, changeOrderId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting change order:', error);
      throw error;
    }
  }

  // Verificar y actualizar Change Orders expirados
  static async updateExpiredChangeOrders(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'pending'),
        where('expiresAt', '<', now)
      );
      
      const querySnapshot = await getDocs(q);
      const batch: Promise<void>[] = [];
      
      querySnapshot.forEach((doc) => {
        batch.push(updateDoc(doc.ref, {
          status: 'expired',
          updatedAt: new Date(),
        }));
      });
      
      if (batch.length > 0) {
        await Promise.all(batch);
        console.log(`Updated ${batch.length} expired change orders`);
      }
    } catch (error) {
      console.error('Error updating expired change orders:', error);
      throw error;
    }
  }

  // Generar URL de aprobación
  static generateApprovalUrl(token: string, baseUrl: string = 'http://localhost:3000'): string {
    return `${baseUrl}/change-orders/approve/${token}`;
  }

  // Obtener órdenes pendientes
  static async getPendingChangeOrders(userId: string): Promise<ChangeOrder[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const changeOrders: ChangeOrder[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const changeOrder = {
          id: doc.id,
          ...data,
          expiresAt: data.expiresAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          clientResponseDate: data.clientResponseDate ? new Date(data.clientResponseDate) : null,
        } as ChangeOrder;
        
        changeOrders.push(changeOrder);
      });
      
      return changeOrders;
    } catch (error) {
      console.error('Error getting pending change orders:', error);
      throw error;
    }
  }

  // Obtener Change Order por ID
  static async getChangeOrderById(changeOrderId: string): Promise<ChangeOrder | null> {
    try {
      const docRef = doc(db, this.collectionName, changeOrderId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      
      return {
        id: docSnap.id,
        ...data,
        expiresAt: data.expiresAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        clientResponseDate: data.clientResponseDate ? new Date(data.clientResponseDate) : null,
      } as ChangeOrder;
    } catch (error) {
      console.error('Error getting change order by ID:', error);
      throw error;
    }
  }

  // Aprobar orden de cambio
  static async approveChangeOrder(changeOrderId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, changeOrderId);
      await updateDoc(docRef, {
        status: 'approved',
        clientResponse: 'approved',
        clientResponseDate: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error approving change order:', error);
      throw error;
    }
  }

}
