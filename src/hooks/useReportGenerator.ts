import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ensureHtml2CanvasGlobal = () => {
  if (typeof window !== 'undefined' && !(window as any).html2canvas) {
    (window as any).html2canvas = html2canvas;
  }
};

const waitForFonts = async () => {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await (document as any).fonts.ready;
    } catch (error) {
      console.warn('Fonts ready promise rejected:', error);
    }
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GRADIENT_CLASSES = [
  'bg-gradient-to-r',
  'from-slate-50',
  'to-blue-50',
  'from-gray-50',
  'to-slate-50',
  'from-slate-100',
  'to-slate-200',
  'from-slate-400',
  'to-slate-500',
];

const sanitizeClone = (root: HTMLElement) => {
  GRADIENT_CLASSES.forEach((cls) => root.classList.remove(cls));

  root.style.backgroundImage = 'none';
  root.style.boxShadow = 'none';
  root.style.filter = 'none';
  root.style.animation = 'none';
  root.style.transition = 'none';
  root.style.transform = 'none';

  if (!root.style.backgroundColor || root.style.backgroundColor === 'transparent') {
    root.style.backgroundColor = '#ffffff';
  }

  if (!root.style.color || root.style.color === 'inherit') {
    root.style.color = '#000000';
  }

  Array.from(root.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      sanitizeClone(child);
    }
  });

  if (root instanceof HTMLImageElement) {
    root.crossOrigin = 'anonymous';
    if (!root.alt) {
      root.alt = 'image';
    }
  }
};

const createPrintableClone = (element: HTMLElement) => {
  const clone = element.cloneNode(true) as HTMLElement;

  sanitizeClone(clone);
  clone.querySelectorAll('.no-print, .action-buttons').forEach((el) => el.remove());

  const width = element.scrollWidth || element.clientWidth || element.offsetWidth;
  if (width) {
    clone.style.width = `${width}px`;
    clone.style.maxWidth = `${width}px`;
  }

  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#000000';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';

  clone.querySelectorAll('*').forEach((node) => {
    if (node instanceof HTMLElement) {
      node.style.transition = 'none';
      node.style.animation = 'none';
      if (!node.style.backgroundColor || node.style.backgroundColor === 'transparent') {
        node.style.backgroundColor = '#ffffff';
      }
      if (!node.style.color || node.style.color === 'inherit') {
        node.style.color = '#000000';
      }
      if (node instanceof HTMLImageElement) {
        node.crossOrigin = 'anonymous';
        if (!node.alt) {
          node.alt = 'image';
        }
      }
    }
  });

  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.opacity = '0';
  clone.style.zIndex = '-1';

  document.body.appendChild(clone);

  const cleanup = () => {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  };

  return { node: clone, cleanup } as const;
};

const createPdfFromImage = (imgData: string, width: number, height: number, filename: string) => {
  const safeWidth = width || 1;
  const safeHeight = height || 1;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const imgHeight = (safeHeight * contentWidth) / safeWidth;
  let position = margin;
  let heightLeft = imgHeight;

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight, undefined, 'FAST');
  heightLeft -= contentHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight, undefined, 'FAST');
    heightLeft -= contentHeight;
  }

  pdf.save(filename);
};

const captureWithDomToImage = async (element: HTMLElement) => {
  const width = element.scrollWidth || element.clientWidth;
  const height = element.scrollHeight || element.clientHeight;

  const imgData = await domtoimage.toPng(element, {
    quality: 1,
    bgcolor: '#ffffff',
    width,
    height,
    style: {
      'background-color': '#ffffff',
      color: '#000000',
    },
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imgData;
  });

  return { imgData, width: image.width, height: image.height };
};

const captureWithHtml2Canvas = async (element: HTMLElement) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth || element.clientWidth,
    windowHeight: element.scrollHeight || element.clientHeight,
    ignoreElements: (node) => {
      if (!(node instanceof HTMLElement)) {
        return false;
      }
      return node.classList.contains('no-print') || node.classList.contains('action-buttons');
    },
  });

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('Canvas capture returned empty dimensions');
  }

  return canvas;
};

export const useReportGenerator = () => {
  const generatePdfFallback = useCallback(async (elementId: string, filename: string = 'report.pdf') => {
    try {
      ensureHtml2CanvasGlobal();
      await waitForFonts();
      await sleep(80);

      console.debug('[ReportPDF] Fallback invoked', { elementId, filename });

      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      console.debug('[ReportPDF] Fallback original element', {
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
      });

      const { node, cleanup } = createPrintableClone(element);
      try {
        const rect = node.getBoundingClientRect();
        console.debug('[ReportPDF] Fallback capture dimensions', {
          width: rect.width,
          height: rect.height,
          scrollWidth: node.scrollWidth,
          scrollHeight: node.scrollHeight,
        });
        const { imgData, width, height } = await captureWithDomToImage(node);
        console.debug('[ReportPDF] dom-to-image result', { width, height });
        createPdfFromImage(imgData, width, height, filename);
        return true;
      } finally {
        cleanup();
      }
    } catch (error) {
      console.error('Error in report PDF fallback:', error);
      throw error;
    }
  }, []);

  const generatePdf = useCallback(
    async (elementId: string, filename: string = 'report.pdf') => {
      ensureHtml2CanvasGlobal();
      await waitForFonts();
      await sleep(100);

      console.debug('[ReportPDF] Primary invoked', { elementId, filename });

      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element with ID "${elementId}" not found`);
        console.log(
          'Available elements with IDs:',
          Array.from(document.querySelectorAll('[id]')).map((el) => el.id)
        );
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      console.debug('[ReportPDF] Primary original element', {
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
      });

      const { node, cleanup } = createPrintableClone(element);
      console.debug('[ReportPDF] Printable clone created', {
        clientWidth: node.clientWidth,
        clientHeight: node.clientHeight,
        scrollWidth: node.scrollWidth,
        scrollHeight: node.scrollHeight,
        offsetWidth: node.offsetWidth,
        offsetHeight: node.offsetHeight,
      });
      let cleaned = false;

      try {
        const rect = node.getBoundingClientRect();
        console.debug('[ReportPDF] Primary capture dimensions', {
          width: rect.width,
          height: rect.height,
          scrollWidth: node.scrollWidth,
          scrollHeight: node.scrollHeight,
        });
        const canvas = await captureWithHtml2Canvas(node);
        console.debug('[ReportPDF] html2canvas result', { width: canvas.width, height: canvas.height });
        const imgData = canvas.toDataURL('image/png');
        createPdfFromImage(imgData, canvas.width, canvas.height, filename);
        return true;
      } catch (error) {
        console.error('Primary report PDF generation failed, attempting fallback:', error);
        cleanup();
        cleaned = true;
        return await generatePdfFallback(elementId, filename);
      } finally {
        if (!cleaned) {
          cleanup();
        }
      }
    },
    [generatePdfFallback]
  );

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
