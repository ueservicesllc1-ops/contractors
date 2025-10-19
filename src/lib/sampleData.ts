import { ProjectService } from './projectService';
import { ClientService } from './clientService';
import { InvoiceService } from './invoiceService';
import { Project, Client, Invoice } from '@/types';

// Datos de ejemplo para clientes
export const sampleClients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '01000',
    notes: 'Cliente preferencial con proyectos residenciales - Constructora González S.A.'
  },
  {
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@empresa.com',
    phone: '+1 (555) 234-5678',
    address: '456 Business Ave',
    city: 'Guadalajara',
    state: 'Jalisco',
    zipCode: '44100',
    notes: 'Especializado en proyectos comerciales - Rodríguez & Asociados'
  },
  {
    name: 'Ana Martínez',
    email: 'ana.martinez@constructora.com',
    phone: '+1 (555) 345-6789',
    address: '789 Industrial Blvd',
    city: 'Monterrey',
    state: 'Nuevo León',
    zipCode: '64000',
    notes: 'Proyectos industriales y de infraestructura - Martínez Construcciones'
  },
  {
    name: 'Roberto Silva',
    email: 'roberto.silva@arquitectura.com',
    phone: '+1 (555) 456-7890',
    address: '321 Design District',
    city: 'Puebla',
    state: 'Puebla',
    zipCode: '72000',
    notes: 'Enfoque en arquitectura sostenible - Silva Arquitectos'
  },
  {
    name: 'Laura Fernández',
    email: 'laura.fernandez@desarrollo.com',
    phone: '+1 (555) 567-8901',
    address: '654 Development St',
    city: 'Tijuana',
    state: 'Baja California',
    zipCode: '22000',
    notes: 'Proyectos de vivienda social - Fernández Desarrollo'
  }
];

// Datos de ejemplo para proyectos
export const sampleProjects: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Casa Residencial Moderna',
    description: 'Construcción de casa unifamiliar de 3 habitaciones con diseño contemporáneo',
    projectNumber: 'PROJ-2025-001',
    clientId: '', // Se asignará dinámicamente
    status: 'active',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-06-15'),
    estimatedCost: 450000,
    actualCost: 125000,
    address: 'Calle Reforma 123',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '01000'
  },
  {
    name: 'Edificio Comercial Centro',
    description: 'Construcción de edificio de oficinas de 8 pisos en el centro de la ciudad',
    projectNumber: 'PROJ-2025-002',
    clientId: '', // Se asignará dinámicamente
    status: 'planning',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-12-31'),
    estimatedCost: 2500000,
    actualCost: 0,
    address: 'Av. Insurgentes 456',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '06100'
  },
  {
    name: 'Remodelación Industrial',
    description: 'Modernización de nave industrial para nueva línea de producción',
    projectNumber: 'PROJ-2025-003',
    clientId: '', // Se asignará dinámicamente
    status: 'completed',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-15'),
    estimatedCost: 800000,
    actualCost: 785000,
    address: 'Zona Industrial Norte 789',
    city: 'Monterrey',
    state: 'Nuevo León',
    zipCode: '64000'
  },
  {
    name: 'Complejo Habitacional',
    description: 'Desarrollo de 50 viviendas sociales con áreas comunes',
    projectNumber: 'PROJ-2025-004',
    clientId: '', // Se asignará dinámicamente
    status: 'onHold',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-11-30'),
    estimatedCost: 1200000,
    actualCost: 150000,
    address: 'Fraccionamiento Las Flores',
    city: 'Tijuana',
    state: 'Baja California',
    zipCode: '22000'
  },
  {
    name: 'Oficinas Corporativas',
    description: 'Diseño y construcción de sede corporativa con certificación sustentable',
    projectNumber: 'PROJ-2025-005',
    clientId: '', // Se asignará dinámicamente
    status: 'planning',
    startDate: new Date('2025-04-15'),
    endDate: new Date('2025-10-15'),
    estimatedCost: 1800000,
    actualCost: 0,
    address: 'Polanco Business District',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '11560'
  }
];

// Datos de ejemplo para facturas mensuales
export const sampleInvoices: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    invoiceNumber: 'INV-2025-001',
    clientId: '', // Se asignará dinámicamente
    projectId: '', // Se asignará dinámicamente
    type: 'invoice',
    status: 'paid',
    issueDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-15'),
    items: [
      {
        description: 'Construcción de cimientos y estructura',
        quantity: 1,
        unitPrice: 45000,
        total: 45000
      },
      {
        description: 'Materiales de construcción',
        quantity: 1,
        unitPrice: 25000,
        total: 25000
      }
    ],
    subtotal: 70000,
    taxRate: 16,
    taxAmount: 11200,
    total: 81200,
    notes: 'Primera factura del proyecto - Fase de cimientos completada'
  },
  {
    invoiceNumber: 'INV-2025-002',
    clientId: '', // Se asignará dinámicamente
    projectId: '', // Se asignará dinámicamente
    type: 'invoice',
    status: 'pending',
    issueDate: new Date('2025-02-10'),
    dueDate: new Date('2025-03-10'),
    items: [
      {
        description: 'Instalación eléctrica y plomería',
        quantity: 1,
        unitPrice: 35000,
        total: 35000
      },
      {
        description: 'Mano de obra especializada',
        quantity: 40,
        unitPrice: 800,
        total: 32000
      }
    ],
    subtotal: 67000,
    taxRate: 16,
    taxAmount: 10720,
    total: 77720,
    notes: 'Segunda factura - Instalaciones eléctricas y de plomería'
  },
  {
    invoiceNumber: 'INV-2025-003',
    clientId: '', // Se asignará dinámicamente
    projectId: '', // Se asignará dinámicamente
    type: 'invoice',
    status: 'overdue',
    issueDate: new Date('2025-03-05'),
    dueDate: new Date('2025-04-05'),
    items: [
      {
        description: 'Acabados y pintura',
        quantity: 1,
        unitPrice: 28000,
        total: 28000
      },
      {
        description: 'Materiales de acabado',
        quantity: 1,
        unitPrice: 15000,
        total: 15000
      }
    ],
    subtotal: 43000,
    taxRate: 16,
    taxAmount: 6880,
    total: 49880,
    notes: 'Tercera factura - Acabados y pintura (VENCIDA)'
  },
  {
    invoiceNumber: 'INV-2025-004',
    clientId: '', // Se asignará dinámicamente
    projectId: '', // Se asignará dinámicamente
    type: 'invoice',
    status: 'paid',
    issueDate: new Date('2025-04-12'),
    dueDate: new Date('2025-05-12'),
    items: [
      {
        description: 'Instalación de pisos',
        quantity: 120,
        unitPrice: 150,
        total: 18000
      },
      {
        description: 'Material de pisos premium',
        quantity: 1,
        unitPrice: 22000,
        total: 22000
      }
    ],
    subtotal: 40000,
    taxRate: 16,
    taxAmount: 6400,
    total: 46400,
    notes: 'Cuarta factura - Instalación de pisos completada'
  },
  {
    invoiceNumber: 'INV-2025-005',
    clientId: '', // Se asignará dinámicamente
    projectId: '', // Se asignará dinámicamente
    type: 'invoice',
    status: 'pending',
    issueDate: new Date('2025-05-08'),
    dueDate: new Date('2025-06-08'),
    items: [
      {
        description: 'Trabajos finales y limpieza',
        quantity: 1,
        unitPrice: 18000,
        total: 18000
      },
      {
        description: 'Inspección final y certificaciones',
        quantity: 1,
        unitPrice: 5000,
        total: 5000
      }
    ],
    subtotal: 23000,
    taxRate: 16,
    taxAmount: 3680,
    total: 26680,
    notes: 'Quinta factura - Trabajos finales y entrega del proyecto'
  }
];

// Función para agregar datos de ejemplo
export async function addSampleData(userId: string): Promise<{ clients: string[], projects: string[], invoices: string[] }> {
  try {
    console.log('Agregando datos de ejemplo...');
    
    // Crear clientes
    const clientIds: string[] = [];
    console.log('Creando clientes...');
    for (const clientData of sampleClients) {
      try {
        const clientId = await ClientService.createClient(userId, clientData);
        clientIds.push(clientId);
        console.log(`✅ Cliente creado: ${clientData.name} (ID: ${clientId})`);
      } catch (error) {
        console.error(`❌ Error creando cliente ${clientData.name}:`, error);
        throw error;
      }
    }
    
    // Crear proyectos con clientes asignados
    const projectIds: string[] = [];
    console.log('Creando proyectos...');
    for (let i = 0; i < sampleProjects.length; i++) {
      try {
        const projectData = {
          ...sampleProjects[i],
          clientId: clientIds[i % clientIds.length] // Asignar clientes de forma cíclica
        };
        const projectId = await ProjectService.createProject(userId, projectData);
        projectIds.push(projectId);
        console.log(`✅ Proyecto creado: ${projectData.name} (ID: ${projectId})`);
      } catch (error) {
        console.error(`❌ Error creando proyecto ${sampleProjects[i].name}:`, error);
        throw error;
      }
    }
    
    // Crear facturas mensuales
    const invoiceIds: string[] = [];
    console.log('Creando facturas...');
    for (let i = 0; i < sampleInvoices.length; i++) {
      try {
        const invoiceData = {
          ...sampleInvoices[i],
          clientId: clientIds[i % clientIds.length], // Asignar clientes de forma cíclica
          projectId: projectIds[i % projectIds.length] // Asignar proyectos de forma cíclica
        };
        console.log(`Creando factura ${i + 1}:`, invoiceData);
        const invoiceId = await InvoiceService.createInvoice(userId, invoiceData);
        invoiceIds.push(invoiceId);
        console.log(`✅ Factura creada: ${invoiceData.invoiceNumber} (ID: ${invoiceId})`);
      } catch (error) {
        console.error(`❌ Error creando factura ${sampleInvoices[i].invoiceNumber}:`, error);
        throw error;
      }
    }
    
    console.log('🎉 Datos de ejemplo agregados exitosamente:');
    console.log(`- ${clientIds.length} clientes creados`);
    console.log(`- ${projectIds.length} proyectos creados`);
    console.log(`- ${invoiceIds.length} facturas creadas`);
    return { clients: clientIds, projects: projectIds, invoices: invoiceIds };
    
  } catch (error) {
    console.error('Error agregando datos de ejemplo:', error);
    throw error;
  }
}
