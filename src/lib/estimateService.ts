import { db } from './firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch, Timestamp } from 'firebase/firestore';
import { Estimate } from '@/types';

export class EstimateService {
  private static collectionName = 'estimates';

  // Crear un nuevo estimado
  static async createEstimate(estimate: Omit<Estimate, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    try {
      // Remover el campo 'id' si existe (Firestore genera su propio ID)
      const { id, ...estimateWithoutId } = estimate as any;
      
      // Convertir fechas a Timestamp
      const estimateData: any = {
        ...estimateWithoutId,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      // Convertir validUntil a Timestamp si existe
      if (estimate.validUntil) {
        estimateData.validUntil = estimate.validUntil instanceof Date 
          ? Timestamp.fromDate(estimate.validUntil)
          : Timestamp.fromDate(new Date(estimate.validUntil));
      }

      const docRef = await addDoc(collection(db, this.collectionName), estimateData);
      console.log('Estimate created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating estimate:', error);
      throw error;
    }
  }

  // Obtener todos los estimados de un usuario
  static async getUserEstimates(userId: string): Promise<Estimate[]> {
    try {
      console.log('📋 ===== GET ESTIMATES START =====');
      console.log('📋 Firebase Project ID:', db.app.options.projectId);
      console.log('📋 Firebase App Name:', db.app.name);
      console.log('📋 Firebase Config:', db.app.options);
      console.log('📋 Collection name:', this.collectionName);
      console.log('📋 User ID:', userId);
      
      // Consulta simplificada sin orderBy para evitar problemas de índices
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      console.log('📋 Executing query (no cache)...');
      // Forzar consulta sin caché
      const querySnapshot = await getDocs(q);
      console.log('📋 Query executed, snapshot size:', querySnapshot.size);
      
      const estimates: Estimate[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        console.log('📄 Processing document:', doc.id);
        console.log('📄 Document userId:', data.userId);
        console.log('📄 Document name:', data.name);
        console.log('📄 Document data.id:', data.id);
        console.log('📄 Document data keys:', Object.keys(data));
        
        // Eliminar el campo 'id' de data para evitar que sobrescriba doc.id
        const { id: dataId, ...dataWithoutId } = data;
        console.log('✅ Using doc.id:', doc.id, 'instead of data.id:', dataId);
        
        estimates.push({
          id: doc.id, // Usar el ID real del documento
          ...dataWithoutId, // Usar los datos sin el campo 'id'
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          validUntil: data.validUntil?.toDate() || new Date(),
        } as Estimate);
      });
      
      // Ordenar en el cliente para evitar necesidad de índice
      estimates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      console.log('📋 Total estimates found:', estimates.length);
      console.log('📋 Estimate IDs:', estimates.map(e => e.id));
      console.log('📋 Estimate names:', estimates.map(e => e.name));
      
      return estimates;
    } catch (error) {
      console.error('Error getting user estimates:', error);
      throw error;
    }
  }

  // Obtener un estimado por ID
  static async getEstimate(estimateId: string): Promise<Estimate | null> {
    try {
      console.log('🔍 Getting estimate with ID:', estimateId);
      console.log('🔍 Collection name:', this.collectionName);
      const docRef = doc(db, this.collectionName, estimateId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Estimate found, document ID:', docSnap.id);
        console.log('✅ Estimate data keys:', Object.keys(data));
        
        // Remover el campo 'id' de data si existe para usar el ID real del documento
        const { id: dataId, ...dataWithoutId } = data;
        
        const estimate = {
          id: docSnap.id, // Usar siempre el ID real del documento
          ...dataWithoutId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          validUntil: data.validUntil?.toDate() || new Date(),
        } as Estimate;
        
        console.log('✅ Returning estimate with ID:', estimate.id);
        return estimate;
      } else {
        console.warn('⚠️ Estimate not found with direct ID, trying to find by estimateNumber or data.id field');
        
        // Si no se encuentra con el ID directo, intentar buscar por estimateNumber o por el campo 'id' guardado
        // Esto es para manejar estimados antiguos que pueden tener IDs aleatorios guardados
        try {
          const q = query(
            collection(db, this.collectionName),
            where('id', '==', estimateId)
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const foundDoc = querySnapshot.docs[0];
            console.log('✅ Found estimate by data.id field, real document ID:', foundDoc.id);
            const data = foundDoc.data();
            const { id: dataId, ...dataWithoutId } = data;
            
            return {
              id: foundDoc.id, // Usar el ID real del documento
              ...dataWithoutId,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              validUntil: data.validUntil?.toDate() || new Date(),
            } as Estimate;
          }
        } catch (searchError) {
          console.error('Error searching by data.id:', searchError);
        }
        
        console.error('❌ Estimate not found with ID:', estimateId);
        return null;
      }
    } catch (error) {
      console.error('Error getting estimate:', error);
      throw error;
    }
  }

  // Actualizar un estimado
  static async updateEstimate(estimateId: string, estimate: Partial<Estimate>): Promise<void> {
    try {
      console.log('📝 ===== UPDATE ESTIMATE START =====');
      console.log('📝 Estimate ID:', estimateId);
      console.log('📝 Collection name:', this.collectionName);
      
      const docRef = doc(db, this.collectionName, estimateId);
      
      // Verificar que el documento existe
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        console.error('❌ Document does not exist:', estimateId);
        throw new Error(`Estimado con ID ${estimateId} no encontrado`);
      }
      
      console.log('✅ Document exists, proceeding with update');
      
      // Preparar datos para actualizar, convirtiendo fechas a Timestamp
      const updateData: any = {
        ...estimate,
        updatedAt: Timestamp.now(),
      };
      
      // Convertir fechas a Timestamp si existen
      if (estimate.validUntil) {
        updateData.validUntil = estimate.validUntil instanceof Date 
          ? Timestamp.fromDate(estimate.validUntil)
          : Timestamp.fromDate(new Date(estimate.validUntil));
      }
      
      // Remover campos que no deben actualizarse directamente
      delete updateData.id;
      delete updateData.createdAt;
      
      console.log('📝 Update data:', updateData);
      
      await updateDoc(docRef, updateData);
      console.log('✅ Estimate updated successfully');
    } catch (error) {
      console.error('Error updating estimate:', error);
      throw error;
    }
  }

  // Eliminar un estimado - MÉTODO DIRECTO
  static async deleteEstimate(estimateId: string): Promise<void> {
    try {
      console.log('🗑️ ===== DELETE ESTIMATE START =====');
      console.log('🗑️ Firebase Project ID:', db.app.options.projectId);
      console.log('🗑️ Collection name:', this.collectionName);
      console.log('🗑️ Estimate ID:', estimateId);
      
      const docRef = doc(db, this.collectionName, estimateId);
      console.log('🗑️ Document reference path:', docRef.path);
      
      // Verificar que el documento existe antes de eliminar
      console.log('🔍 Checking if document exists before deletion...');
      const beforeSnap = await getDoc(docRef);
      if (!beforeSnap.exists()) {
        console.log('❌ Document does not exist, nothing to delete');
        return;
      }
      console.log('✅ Document exists, proceeding with deletion');
      console.log('📄 Document data before deletion:', beforeSnap.data());
      
      console.log('🗑️ Calling deleteDoc...');
      await deleteDoc(docRef);
      console.log('✅ deleteDoc completed');
      
      // Esperar un momento para que se propague
      console.log('⏳ Waiting for propagation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar eliminación
      console.log('🔍 Verifying deletion...');
      const verifySnap = await getDoc(docRef);
      
      if (verifySnap.exists()) {
        console.log('❌ DOCUMENT STILL EXISTS AFTER DELETION!');
        console.log('❌ Document data:', verifySnap.data());
        console.log('❌ This means the deletion failed');
        throw new Error('Document still exists after deletion attempt');
      } else {
        console.log('✅ CONFIRMED: Document successfully deleted from Firebase');
      }
      
      console.log('✅ ===== DELETE COMPLETE =====');
    } catch (error: any) {
      console.error('❌ ===== DELETE ERROR =====');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Estimate ID:', estimateId);
      console.error('❌ ===== DELETE ERROR END =====');
      throw error;
    }
  }
}
