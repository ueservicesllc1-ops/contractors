import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  companyName: string;
  isPremium: boolean;
  subscriptionType: 'free' | 'premium' | 'enterprise';
  createdAt: Date;
  lastLogin: Date;
  totalProjects: number;
  totalInvoices: number;
  totalRevenue: number;
  isComplete: boolean;
  profileCompletionDate?: Date;
}

export class AdminService {
  // Obtener todos los usuarios registrados
  static async getAllUsers(): Promise<AdminUser[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users: AdminUser[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Obtener estadísticas del usuario
        const [projectsSnapshot, invoicesSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'projects'), where('userId', '==', userDoc.id))),
          getDocs(query(collection(db, 'invoices'), where('userId', '==', userDoc.id)))
        ]);

        const totalProjects = projectsSnapshot.size;
        const totalInvoices = invoicesSnapshot.size;
        
        // Calcular ingresos totales de facturas pagadas
        let totalRevenue = 0;
        invoicesSnapshot.forEach(invoiceDoc => {
          const invoiceData = invoiceDoc.data();
          if (invoiceData.status === 'paid' && invoiceData.total) {
            totalRevenue += invoiceData.total;
          }
        });

        // Determinar tipo de suscripción basado en isPremium
        const subscriptionType = userData.isPremium ? 'premium' : 'free';

        users.push({
          id: userDoc.id,
          email: userData.email || 'N/A',
          name: userData.name || userData.displayName || 'Usuario',
          companyName: userData.companyName || 'Sin empresa',
          isPremium: userData.isPremium || false,
          subscriptionType,
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLogin: userData.lastLogin?.toDate() || new Date(),
          totalProjects,
          totalInvoices,
          totalRevenue,
          isComplete: userData.isComplete || false,
          profileCompletionDate: userData.profileCompletionDate?.toDate()
        });
      }

      // Ordenar por fecha de creación (más recientes primero)
      return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Actualizar tipo de suscripción de usuario
  static async updateUserSubscription(userId: string, subscriptionType: 'free' | 'premium' | 'enterprise'): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isPremium: subscriptionType !== 'free',
        subscriptionType,
        updatedAt: new Date()
      });
      console.log(`✅ User ${userId} subscription updated to ${subscriptionType}`);
    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }
  }

  // Eliminar usuario
  static async deleteUser(userId: string): Promise<void> {
    try {
      // Eliminar usuario de la colección users
      await deleteDoc(doc(db, 'users', userId));
      
      // TODO: También eliminar datos relacionados (proyectos, facturas, etc.)
      // Esto requeriría una función más compleja para limpiar todos los datos del usuario
      
      console.log(`✅ User ${userId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Obtener estadísticas generales
  static async getSystemStats(): Promise<{
    totalUsers: number;
    premiumUsers: number;
    freeUsers: number;
    totalRevenue: number;
    totalProjects: number;
    totalInvoices: number;
  }> {
    try {
      const users = await this.getAllUsers();
      
      return {
        totalUsers: users.length,
        premiumUsers: users.filter(u => u.isPremium).length,
        freeUsers: users.filter(u => !u.isPremium).length,
        totalRevenue: users.reduce((sum, user) => sum + user.totalRevenue, 0),
        totalProjects: users.reduce((sum, user) => sum + user.totalProjects, 0),
        totalInvoices: users.reduce((sum, user) => sum + user.totalInvoices, 0)
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  }
}
