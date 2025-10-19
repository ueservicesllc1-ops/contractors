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
import { Client } from '@/types';

const CLIENTS_COLLECTION = 'clients';

export class ClientService {
  // Crear un nuevo cliente
  static async createClient(userId: string, clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), {
        ...clientData,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // Obtener todos los clientes de un usuario
  static async getUserClients(userId: string): Promise<Client[]> {
    try {
      const q = query(
        collection(db, CLIENTS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const clients: Client[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clients.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Client);
      });
      
      // Ordenar por fecha de creación en el cliente
      return clients.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting user clients:', error);
      throw error;
    }
  }

  // Obtener un cliente específico
  static async getClient(clientId: string): Promise<Client | null> {
    try {
      const docRef = doc(db, CLIENTS_COLLECTION, clientId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Client;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting client:', error);
      throw error;
    }
  }

  // Actualizar un cliente
  static async updateClient(clientId: string, updates: Partial<Client>): Promise<void> {
    try {
      const docRef = doc(db, CLIENTS_COLLECTION, clientId);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  // Eliminar un cliente
  static async deleteClient(clientId: string): Promise<void> {
    try {
      const docRef = doc(db, CLIENTS_COLLECTION, clientId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }
}
