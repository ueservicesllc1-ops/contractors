'use client';

import React, { useState } from 'react';
import { Estimate } from '@/types';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { PrinterIcon, CheckCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { usePdfGenerator } from '@/hooks/usePdfGenerator';
import toast from 'react-hot-toast';

interface EstimateViewProps {
  estimate: Estimate;
  projectName?: string;
  clientName?: string;
  clientAddress?: string;
}

const statusLabels = {
  draft: 'Borrador',
  sent: 'Enviado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const statusColors = {
  draft: 'text-gray-600',
  sent: 'text-blue-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
};

export default function EstimateView({ 
  estimate, 
  projectName, 
  clientName, 
  clientAddress 
}: EstimateViewProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { generatePdf, generatePdfAlternative } = usePdfGenerator();

  const handlePrint = () => {
    window.print();
  };


  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      
      const filename = `estimado-${estimate.estimateNumber}.pdf`;
      
      // Crear una versión simplificada del estimado sin gradientes
      const createSimplifiedEstimate = () => {
        const originalElement = document.getElementById('estimate-container');
        if (!originalElement) return null;
        
        const simplified = originalElement.cloneNode(true) as HTMLElement;
        
        // Función recursiva para limpiar estilos problemáticos
        const cleanElement = (el: HTMLElement) => {
          // Remover todas las clases de gradientes
          const problematicClasses = [
            'bg-gradient-to-r', 'from-slate-50', 'to-blue-50', 'from-gray-50', 'to-slate-50',
            'from-slate-100', 'to-slate-200', 'from-blue-50', 'to-slate-50',
            'from-slate-400', 'to-slate-500', 'bg-gradient-to-r'
          ];
          
          if (el.classList) {
            problematicClasses.forEach(cls => el.classList.remove(cls));
          }
          
          // Aplicar estilos básicos seguros
          el.style.backgroundColor = '#ffffff';
          el.style.color = '#000000';
          el.style.border = '1px solid #e5e7eb';
          
          // Limpiar elementos hijos
          Array.from(el.children).forEach(child => {
            if (child instanceof HTMLElement) {
              cleanElement(child);
            }
          });
        };
        
        cleanElement(simplified);
        
        // Agregar estilos básicos al contenedor
        simplified.style.padding = '20px';
        simplified.style.fontFamily = 'Arial, sans-serif';
        simplified.style.fontSize = '14px';
        simplified.style.lineHeight = '1.5';
        simplified.style.width = '800px';
        
        return simplified;
      };
      
      try {
        // Crear elemento simplificado
        const simplifiedElement = createSimplifiedEstimate();
        if (!simplifiedElement) {
          throw new Error('No se pudo crear el elemento simplificado');
        }
        
        // Agregar temporalmente al DOM
        simplifiedElement.style.position = 'absolute';
        simplifiedElement.style.left = '-9999px';
        simplifiedElement.style.top = '0';
        simplifiedElement.id = 'estimate-simplified';
        document.body.appendChild(simplifiedElement);
        
        // Usar método alternativo con elemento simplificado
        await generatePdfAlternative('estimate-simplified', filename);
        toast.success('PDF generado exitosamente');
        
        // Remover elemento temporal
        document.body.removeChild(simplifiedElement);
        
      } catch (error) {
        console.warn('Simplified method failed, trying original:', error);
        // Fallback al método original
        await generatePdfAlternative('estimate-container', filename);
        toast.success('PDF generado usando método alternativo');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Print Actions */}
      <div className="mb-6 flex justify-end space-x-3 print:hidden no-print">
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PrinterIcon className="h-4 w-4 mr-2" />
          Imprimir
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>

      {/* Estimate Document */}
      <div id="estimate-container" className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ESTIMADO DE CONSTRUCCIÓN</h1>
              <p className="text-lg text-gray-600 mt-1">{estimate.name}</p>
              {/* Estado oculto - no mostrar status */}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Estimado #</p>
              <p className="text-lg font-semibold text-gray-900">{estimate.estimateNumber}</p>
              <p className="text-sm text-gray-600 mt-1">Fecha: {formatShortDate(estimate.createdAt)}</p>
              <p className="text-sm text-gray-600">Válido hasta: {formatShortDate(estimate.validUntil)}</p>
            </div>
          </div>
        </div>

        {/* Contractor Information */}
        <div className="px-8 py-6 border-b bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Contratista</h3>
              {estimate.contractorName && (
                <p className="font-medium text-gray-900">{estimate.contractorName}</p>
              )}
              {estimate.contractorAddress && (
                <p className="text-gray-600">{estimate.contractorAddress}</p>
              )}
              {estimate.contractorPhone && (
                <p className="text-gray-600">Tel: {estimate.contractorPhone}</p>
              )}
              {estimate.contractorEmail && (
                <p className="text-gray-600">Email: {estimate.contractorEmail}</p>
              )}
              {estimate.contractorLicense && (
                <p className="text-gray-600 font-medium">Licencia: {estimate.contractorLicense}</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Cliente</h3>
              {clientName && (
                <p className="font-medium text-gray-900">{clientName}</p>
              )}
              {clientAddress && (
                <p className="text-gray-600">{clientAddress}</p>
              )}
              {projectName && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Proyecto:</p>
                  <p className="font-medium text-gray-900">{projectName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {estimate.description && (
          <div className="px-8 py-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción del Trabajo</h3>
            <p className="text-gray-700">{estimate.description}</p>
          </div>
        )}

        {/* Estimate Sections */}
        <div className="px-8 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Desglose de Costos</h3>
          
          {estimate.sections.map((section) => (
            <div key={section.id} className="mb-8">
              <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-3 border-b border-slate-300">
                <h4 className="font-semibold text-gray-900">{section.name}</h4>
                {section.description && (
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                )}
              </div>
              
              {section.items.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <p>No hay items en esta sección</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-slate-400 to-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                          Unidad
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                          Precio Unit.
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {section.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.description}
                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">
                            {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="bg-gray-100 px-4 py-3 border-t">
                <div className="flex justify-end">
                  <span className="text-sm font-semibold text-gray-900">
                    Subtotal {section.name}: {formatCurrency(
                      section.items.reduce((sum, item) => sum + item.total, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-slate-50 border-t border-blue-200">
          <div className="max-w-md ml-auto">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(estimate.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Impuestos ({estimate.taxRate}%):</span>
                <span>{formatCurrency(estimate.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(estimate.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="px-8 py-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Términos y Condiciones</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              {estimate.terms && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Términos de Pago:</h4>
                  <p>{estimate.terms}</p>
                </div>
              )}
              
              {estimate.warrantyInfo && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Garantía:</h4>
                  <p>{estimate.warrantyInfo}</p>
                </div>
              )}
            </div>
            
            <div>
              {estimate.cancellationRights && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Derechos de Cancelación:</h4>
                  <p>{estimate.cancellationRights}</p>
                </div>
              )}
              
              {estimate.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notas Adicionales:</h4>
                  <p>{estimate.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-100 border-t text-center text-xs text-gray-500">
          <p>Este estimado es válido por 30 días a partir de la fecha de emisión.</p>
          <p className="mt-1">Para proyectos en New Jersey, este contratista está licenciado y asegurado.</p>
        </div>
      </div>
    </div>
  );
}
