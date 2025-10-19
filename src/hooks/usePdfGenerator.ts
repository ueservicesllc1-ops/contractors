import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image';

export const usePdfGenerator = () => {
  const generatePdf = useCallback(async (elementId: string, filename: string = 'invoice.pdf') => {
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

      // Configuración simplificada para evitar problemas con colores lab
      let canvas;
      try {
        canvas = await html2canvas(element, {
          scale: 1.5, // Escala moderada para mejor compatibilidad
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          // Configuraciones básicas para evitar errores de color
          foreignObjectRendering: false,
          // Ignorar elementos problemáticos
          ignoreElements: (element) => {
            return element.classList?.contains('no-print') || 
                   element.classList?.contains('action-buttons') || false;
          }
        });
      } catch (colorError) {
        console.warn('Error with advanced html2canvas config, trying basic config:', colorError);
        // Configuración básica como fallback
        canvas = await html2canvas(element, {
          scale: 1,
          backgroundColor: '#ffffff',
          logging: false,
          ignoreElements: (element) => {
            return element.classList?.contains('no-print') || 
                   element.classList?.contains('action-buttons') || false;
          }
        });
      }

      const imgData = canvas.toDataURL('image/png');
      
      // Crear PDF con márgenes apropiados
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 15; // Margen de 15mm en todos los lados
      const contentWidth = pageWidth - (2 * margin);
      const contentHeight = pageHeight - (2 * margin);
      
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
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

  const generatePdfAlternative = useCallback(async (elementId: string, filename: string = 'invoice.pdf') => {
    // Función alternativa que usa dom-to-image para evitar problemas con colores lab
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      console.log('Using dom-to-image for PDF generation');
      
      // Usar dom-to-image que maneja mejor los colores de CSS
      const imgData = await domtoimage.toPng(element, {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          // Forzar estilos básicos para evitar problemas de color
          'background-color': '#ffffff',
          'color': '#000000'
        }
      });

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

      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
      heightLeft -= contentHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
        heightLeft -= contentHeight;
      }

      pdf.save(filename);
    } catch (error) {
      console.error('Error in alternative PDF generation:', error);
      throw error;
    }
  }, []);

  return { generatePdf, generatePdfAlternative };
};
