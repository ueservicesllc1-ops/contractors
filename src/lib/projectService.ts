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
import { Project } from '@/types';
import { InvoiceService } from './invoiceService';
import { PurchaseService } from './purchaseService';

const PROJECTS_COLLECTION = 'projects';

export class ProjectService {
  // Crear un nuevo proyecto
  static async createProject(userId: string, projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
        ...projectData,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        startDate: Timestamp.fromDate(projectData.startDate),
        endDate: projectData.endDate ? Timestamp.fromDate(projectData.endDate) : null,
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Obtener todos los proyectos de un usuario
  static async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const q = query(
        collection(db, PROJECTS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const projects: Project[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate ? data.endDate.toDate() : undefined,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Project);
      });
      
      // Ordenar por fecha de creación en el cliente
      return projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  }

  // Obtener un proyecto específico
  static async getProject(projectId: string): Promise<Project | null> {
    try {
      const docRef = doc(db, PROJECTS_COLLECTION, projectId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate ? data.endDate.toDate() : undefined,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Project;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  }

  // Actualizar un proyecto
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const docRef = doc(db, PROJECTS_COLLECTION, projectId);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };
      
      // Convertir fechas a Timestamp si existen
      if (updates.startDate) updateData.startDate = Timestamp.fromDate(updates.startDate);
      if (updates.endDate) updateData.endDate = Timestamp.fromDate(updates.endDate);
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  // Eliminar un proyecto
  static async deleteProject(projectId: string): Promise<void> {
    try {
      const docRef = doc(db, PROJECTS_COLLECTION, projectId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  // Calcular gastos reales del proyecto
  static async calculateProjectActualCost(projectId: string, userId: string): Promise<number> {
    try {
      let totalCost = 0;

      // Obtener compras del proyecto (estos son los gastos reales)
      const purchases = await PurchaseService.getUserPurchases(userId);
      const projectPurchases = purchases.filter(purchase => 
        purchase.projectId === projectId
      );
      
      const purchasesTotal = projectPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);

      // Obtener facturas pagadas del proyecto (para información, no para gastos)
      const invoices = await InvoiceService.getUserInvoices(userId);
      const projectInvoices = invoices.filter(invoice => 
        invoice.projectId === projectId && invoice.status === 'paid'
      );
      
      const paidInvoicesTotal = projectInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

      totalCost = purchasesTotal; // Solo las compras son gastos reales
      
      console.log(`💰 Project ${projectId} actual cost calculation:`, {
        purchases: projectPurchases.length,
        purchasesTotal,
        paidInvoices: projectInvoices.length,
        paidInvoicesTotal,
        actualCost: totalCost
      });

      return totalCost;
    } catch (error) {
      console.error('Error calculating project actual cost:', error);
      return 0;
    }
  }

  // Obtener proyectos con gastos reales calculados
  static async getUserProjectsWithActualCost(userId: string): Promise<Project[]> {
    try {
      const projects = await this.getUserProjects(userId);
      
      // Calcular gastos reales para cada proyecto
      const projectsWithActualCost = await Promise.all(
        projects.map(async (project) => {
          const actualCost = await this.calculateProjectActualCost(project.id, userId);
          return {
            ...project,
            actualCost
          };
        })
      );
      
      return projectsWithActualCost;
    } catch (error) {
      console.error('Error getting projects with actual cost:', error);
      throw error;
    }
  }

  // Actualizar presupuesto del proyecto cuando se acepta un estimado
  static async updateProjectBudget(projectId: string, estimateAmount: number): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }

      // Sumar el monto del estimado al presupuesto actual
      const newBudget = project.estimatedCost + estimateAmount;
      
      await this.updateProject(projectId, { 
        estimatedCost: newBudget 
      });

      console.log(`💰 Updated project ${projectId} budget:`, {
        previousBudget: project.estimatedCost,
        estimateAmount,
        newBudget
      });
    } catch (error) {
      console.error('Error updating project budget:', error);
      throw error;
    }
  }
}
