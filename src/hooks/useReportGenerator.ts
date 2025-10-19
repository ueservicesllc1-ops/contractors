import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const useReportGenerator = () => {
  const generatePdf = useCallback(async (elementId: string, filename: string = 'report.pdf') => {
    try {
      // Esperar un poco para asegurar que el DOM esté listo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element with ID "${elementId}" not found`);
        console.log('Available elements with IDs:', 
          Array.from(document.querySelectorAll('[id]')).map(el => el.id)
        );
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      // Crear una versión simplificada del reporte sin gradientes
      const createSimplifiedReport = () => {
        const simplified = element.cloneNode(true) as HTMLElement;
        
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

      // Usar el método alternativo con elemento simplificado
      let imgData;
      try {
        console.log('Using dom-to-image with simplified element for PDF generation');
        
        // Crear elemento simplificado
        const simplifiedElement = createSimplifiedReport();
        
        // Agregar temporalmente al DOM
        simplifiedElement.style.position = 'absolute';
        simplifiedElement.style.left = '-9999px';
        simplifiedElement.style.top = '0';
        simplifiedElement.id = 'reports-simplified';
        document.body.appendChild(simplifiedElement);
        
        // Usar dom-to-image con elemento simplificado
        imgData = await domtoimage.toPng(simplifiedElement, {
          quality: 1.0,
          bgcolor: '#ffffff',
          width: simplifiedElement.scrollWidth,
          height: simplifiedElement.scrollHeight,
          style: {
            'background-color': '#ffffff',
            'color': '#000000'
          }
        });
        
        // Remover elemento temporal
        document.body.removeChild(simplifiedElement);
        
      } catch (domError) {
        console.warn('dom-to-image failed, trying html2canvas:', domError);
        
        // Fallback a html2canvas con configuración básica
        const canvas = await html2canvas(element, {
          scale: 1,
          backgroundColor: '#ffffff',
          logging: false,
          ignoreElements: (element) => {
            return element.classList?.contains('no-print') || 
                   element.classList?.contains('action-buttons') || false;
          }
        });
        
        imgData = canvas.toDataURL('image/png');
      }
      
      // Crear imagen para obtener dimensiones
      const img = new Image();
      img.src = imgData;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Crear PDF con jsPDF con márgenes apropiados
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 15; // Margen de 15mm en todos los lados
      const contentWidth = pageWidth - (2 * margin);
      const contentHeight = pageHeight - (2 * margin);
      
      const imgHeight = (img.height * contentWidth) / img.width;
      let heightLeft = imgHeight;

      let position = margin;

      // Agregar primera página
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
      heightLeft -= contentHeight;

      // Agregar páginas adicionales si es necesario
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
        heightLeft -= contentHeight;
      }

      // Descargar PDF
      pdf.save(filename);
      
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }, []);

  const generateExcel = useCallback((reportData: any, filename: string = 'report.xlsx') => {
    try {
      // Crear workbook
      const workbook = XLSX.utils.book_new();

      // Hoja 1: Resumen General
      const summaryData = [
        ['REPORTE DE RENDIMIENTO', ''],
        ['Fecha de Generación', new Date().toLocaleDateString()],
        ['', ''],
        ['ESTADÍSTICAS GENERALES', ''],
        ['Total de Proyectos', reportData.totalProjects],
        ['Proyectos Activos', reportData.activeProjects],
        ['Proyectos Completados', reportData.completedProjects],
        ['Ingresos Totales', `$${reportData.totalRevenue.toLocaleString()}`],
        ['Margen de Ganancia', `${reportData.profitMargin.toFixed(1)}%`],
        ['', ''],
        ['FACTURACIÓN', ''],
        ['Facturas Pagadas', reportData.paidInvoices],
        ['Facturas Pendientes', reportData.pendingInvoices],
        ['Ingresos del Mes', `$${reportData.monthlyRevenue.toLocaleString()}`],
        ['', ''],
        ['ÓRDENES DE CAMBIO', ''],
        ['Total Órdenes', reportData.changeOrders],
        ['Órdenes Aprobadas', reportData.approvedChangeOrders],
        ['Tasa de Aprobación', `${reportData.changeOrders > 0 ? ((reportData.approvedChangeOrders / reportData.changeOrders) * 100).toFixed(1) : 0}%`],
        ['Órdenes Pendientes', reportData.changeOrders - reportData.approvedChangeOrders],
        ['', ''],
        ['INDICADORES DE RENDIMIENTO', ''],
        ['Tasa de Finalización', `${reportData.totalProjects > 0 ? ((reportData.completedProjects / reportData.totalProjects) * 100).toFixed(1) : 0}%`],
        ['Tasa de Cobro', `${reportData.paidInvoices + reportData.pendingInvoices > 0 ? ((reportData.paidInvoices / (reportData.paidInvoices + reportData.pendingInvoices)) * 100).toFixed(1) : 0}%`],
        ['Aprobación de Cambios', `${reportData.changeOrders > 0 ? ((reportData.approvedChangeOrders / reportData.changeOrders) * 100).toFixed(1) : 0}%`]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Aplicar estilos básicos
      const range = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!summarySheet[cellAddress]) continue;
          
          if (R === 0) {
            // Título principal
            summarySheet[cellAddress].s = {
              font: { bold: true, size: 16 },
              alignment: { horizontal: 'center' }
            };
          } else if (summarySheet[cellAddress].v && typeof summarySheet[cellAddress].v === 'string' && 
                     (summarySheet[cellAddress].v.includes('ESTADÍSTICAS') || 
                      summarySheet[cellAddress].v.includes('FACTURACIÓN') || 
                      summarySheet[cellAddress].v.includes('ÓRDENES') || 
                      summarySheet[cellAddress].v.includes('INDICADORES'))) {
            // Subtítulos
            summarySheet[cellAddress].s = {
              font: { bold: true, size: 12 },
              fill: { fgColor: { rgb: 'E5E7EB' } }
            };
          }
        }
      }

      // Ajustar ancho de columnas
      summarySheet['!cols'] = [
        { wch: 25 },
        { wch: 20 }
      ];

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen General');

      // Hoja 2: Análisis Detallado
      const detailedData = [
        ['ANÁLISIS DETALLADO', ''],
        ['', ''],
        ['MÉTRICAS FINANCIERAS', 'Valor'],
        ['Ingresos Totales', reportData.totalRevenue],
        ['Ingresos del Mes', reportData.monthlyRevenue],
        ['Margen de Ganancia (%)', reportData.profitMargin],
        ['', ''],
        ['MÉTRICAS DE PROYECTOS', 'Valor'],
        ['Total Proyectos', reportData.totalProjects],
        ['Proyectos Activos', reportData.activeProjects],
        ['Proyectos Completados', reportData.completedProjects],
        ['Tasa de Finalización (%)', reportData.totalProjects > 0 ? (reportData.completedProjects / reportData.totalProjects) * 100 : 0],
        ['', ''],
        ['MÉTRICAS DE FACTURACIÓN', 'Valor'],
        ['Facturas Pagadas', reportData.paidInvoices],
        ['Facturas Pendientes', reportData.pendingInvoices],
        ['Tasa de Cobro (%)', reportData.paidInvoices + reportData.pendingInvoices > 0 ? (reportData.paidInvoices / (reportData.paidInvoices + reportData.pendingInvoices)) * 100 : 0],
        ['', ''],
        ['MÉTRICAS DE CAMBIOS', 'Valor'],
        ['Total Órdenes de Cambio', reportData.changeOrders],
        ['Órdenes Aprobadas', reportData.approvedChangeOrders],
        ['Órdenes Pendientes', reportData.changeOrders - reportData.approvedChangeOrders],
        ['Tasa de Aprobación (%)', reportData.changeOrders > 0 ? (reportData.approvedChangeOrders / reportData.changeOrders) * 100 : 0]
      ];

      const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
      
      // Aplicar estilos a la hoja detallada
      const detailedRange = XLSX.utils.decode_range(detailedSheet['!ref'] || 'A1');
      for (let R = detailedRange.s.r; R <= detailedRange.e.r; ++R) {
        for (let C = detailedRange.s.c; C <= detailedRange.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!detailedSheet[cellAddress]) continue;
          
          if (R === 0) {
            detailedSheet[cellAddress].s = {
              font: { bold: true, size: 16 },
              alignment: { horizontal: 'center' }
            };
          } else if (detailedSheet[cellAddress].v && typeof detailedSheet[cellAddress].v === 'string' && 
                     detailedSheet[cellAddress].v.includes('MÉTRICAS')) {
            detailedSheet[cellAddress].s = {
              font: { bold: true, size: 12 },
              fill: { fgColor: { rgb: 'E5E7EB' } }
            };
          }
        }
      }

      detailedSheet['!cols'] = [
        { wch: 30 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Análisis Detallado');

      // Generar y descargar archivo
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);

      return true;
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw error;
    }
  }, []);

  return {
    generatePdf,
    generateExcel
  };
};
