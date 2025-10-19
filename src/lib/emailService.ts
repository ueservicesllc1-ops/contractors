import { ChangeOrder } from '@/types';

export class EmailService {
  /**
   * Envía un email de aprobación de Change Order al cliente
   */
  static async sendChangeOrderApprovalEmail(
    changeOrder: ChangeOrder,
    approvalUrl: string
  ): Promise<boolean> {
    try {
      console.log('📧 Enviando email de aprobación...');
      console.log('📧 Destinatario:', changeOrder.clientEmail);
      console.log('🔗 URL de aprobación:', approvalUrl);
      
      // TODO: Implementar servicio de email real (SendGrid, AWS SES, etc.)
      // Por ahora solo simulamos el envío
      
      const emailContent = this.generateEmailContent(changeOrder, approvalUrl);
      console.log('📧 Contenido del email:', emailContent);
      
      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Email enviado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return false;
    }
  }

  /**
   * Genera el contenido del email de aprobación
   */
  private static generateEmailContent(changeOrder: ChangeOrder, approvalUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Orden de Cambio - Aprobación Requerida</h2>
        
        <p>Estimado/a <strong>${changeOrder.clientName}</strong>,</p>
        
        <p>Se ha creado una nueva orden de cambio para su proyecto <strong>"${changeOrder.projectName}"</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Detalles del Cambio</h3>
          <p><strong>Título:</strong> ${changeOrder.title}</p>
          <p><strong>Descripción:</strong> ${changeOrder.description}</p>
          <p><strong>Razón:</strong> ${changeOrder.reason}</p>
          <p><strong>Monto Original:</strong> $${changeOrder.originalAmount.toLocaleString()}</p>
          <p><strong>Monto Adicional:</strong> $${changeOrder.changeAmount.toLocaleString()}</p>
          <p><strong>Nuevo Total:</strong> $${changeOrder.newTotalAmount.toLocaleString()}</p>
          <p><strong>Impacto en Cronograma:</strong> ${changeOrder.impactOnSchedule}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalUrl}" 
             style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            🔗 Revisar y Aprobar Cambio
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Importante:</strong> Este enlace expira el ${new Date(changeOrder.expiresAt).toLocaleDateString()}.
          Por favor, revise los detalles y tome una decisión antes de esa fecha.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 12px;">
          Este es un email automático del sistema de gestión de proyectos. 
          Si tiene alguna pregunta, por favor contacte directamente con su contratista.
        </p>
      </div>
    `;
  }

  /**
   * Envía email de confirmación cuando el cliente responde
   */
  static async sendResponseConfirmationEmail(
    changeOrder: ChangeOrder,
    response: 'approved' | 'declined',
    contractorEmail: string
  ): Promise<boolean> {
    try {
      console.log('📧 Enviando email de confirmación de respuesta...');
      console.log('📧 Destinatario:', contractorEmail);
      console.log('📧 Respuesta:', response);
      
      // TODO: Implementar envío real
      const emailContent = this.generateResponseConfirmationContent(changeOrder, response);
      console.log('📧 Contenido del email:', emailContent);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Email de confirmación enviado');
      return true;
    } catch (error) {
      console.error('❌ Error enviando email de confirmación:', error);
      return false;
    }
  }

  /**
   * Genera el contenido del email de confirmación de respuesta
   */
  private static generateResponseConfirmationContent(
    changeOrder: ChangeOrder, 
    response: 'approved' | 'declined'
  ): string {
    const statusText = response === 'approved' ? 'APROBADO' : 'RECHAZADO';
    const statusColor = response === 'approved' ? '#10b981' : '#ef4444';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Respuesta de Orden de Cambio</h2>
        
        <p>El cliente <strong>${changeOrder.clientName}</strong> ha respondido a la orden de cambio:</p>
        
        <div style="background-color: ${statusColor}20; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0;">
          <h3 style="color: ${statusColor}; margin-top: 0;">
            ${statusText}
          </h3>
          <p><strong>Proyecto:</strong> ${changeOrder.projectName}</p>
          <p><strong>Título del Cambio:</strong> ${changeOrder.title}</p>
          <p><strong>Monto Adicional:</strong> $${changeOrder.changeAmount.toLocaleString()}</p>
        </div>
        
        <p>Puede revisar todos los detalles en su panel de control.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 12px;">
          Este es un email automático del sistema de gestión de proyectos.
        </p>
      </div>
    `;
  }
}
