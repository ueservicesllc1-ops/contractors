import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image';

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

const sanitizeClone = (root: HTMLElement) => {
  // Solo deshabilitar animaciones y transiciones para evitar problemas durante la captura
  root.style.animation = 'none';
  root.style.transition = 'none';
  
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

  // Remover solo elementos que no deben aparecer en el PDF
  clone.querySelectorAll('.no-print, .action-buttons').forEach((el) => el.remove());

  // Aplicar sanitización mínima (solo animaciones/transiciones)
  sanitizeClone(clone);

  // Obtener dimensiones del elemento original
  const rect = element.getBoundingClientRect();
  const width = rect.width || element.scrollWidth || element.clientWidth || element.offsetWidth || 800;
  const height = element.scrollHeight || element.clientHeight || element.offsetHeight || 1000;

  // Establecer dimensiones explícitas para el clon
  clone.style.width = `${width}px`;
  clone.style.maxWidth = `${width}px`;
  clone.style.minWidth = `${width}px`;
  clone.style.height = 'auto';
  clone.style.minHeight = `${height}px`;
  clone.style.display = 'block';
  clone.style.overflow = 'visible';

  // Solo deshabilitar animaciones y transiciones en todos los elementos
  // NO modificar colores, fondos, bordes, sombras, etc.
  clone.querySelectorAll('*').forEach((node) => {
    if (node instanceof HTMLElement) {
      node.style.transition = 'none';
      node.style.animation = 'none';
      if (node instanceof HTMLImageElement) {
        node.crossOrigin = 'anonymous';
        if (!node.alt) {
          node.alt = 'image';
        }
      }
    }
  });

  // Posicionar el clon fuera de la vista pero visible para html2canvas
  clone.style.position = 'fixed';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.width = `${width}px`;
  clone.style.visibility = 'visible';
  clone.style.opacity = '1';
  clone.style.zIndex = '9999';
  clone.style.pointerEvents = 'none';
  
  // Asignar un ID único al clon para evitar conflictos
  const cloneId = `pdf-clone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  clone.id = cloneId;

  document.body.appendChild(clone);

  // Forzar reflow para asegurar que el elemento esté renderizado
  void clone.offsetHeight;

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
  // Asegurar que el elemento esté completamente renderizado
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

  const width = element.scrollWidth || element.clientWidth || element.offsetWidth || 800;
  const height = element.scrollHeight || element.clientHeight || element.offsetHeight || 1000;

  const imgData = await domtoimage.toPng(element, {
    quality: 1,
    bgcolor: '#ffffff',
    width: width,
    height: height,
    style: {
      'background-color': '#ffffff',
      color: '#000000',
    },
    filter: (node) => {
      if (node instanceof HTMLElement) {
        return !node.classList.contains('no-print') && !node.classList.contains('action-buttons');
      }
      return true;
    },
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.error('Error loading image:', err);
      reject(err);
    };
    img.src = imgData;
  });

  return { imgData, width: image.width || width, height: image.height || height };
};

const captureWithHtml2Canvas = async (element: HTMLElement) => {
  // Asegurar que el elemento esté completamente renderizado
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

  const width = element.scrollWidth || element.clientWidth || element.offsetWidth || 800;
  const height = element.scrollHeight || element.clientHeight || element.offsetHeight || 1000;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null, // Usar null para mantener el fondo original
    logging: false,
    width: width,
    height: height,
    windowWidth: width,
    windowHeight: height,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    foreignObjectRendering: false, // Deshabilitar foreignObject para evitar problemas con CSS moderno
    ignoreElements: (node) => {
      if (!(node instanceof HTMLElement)) {
        return false;
      }
      return node.classList.contains('no-print') || node.classList.contains('action-buttons');
    },
    onclone: (clonedDoc, clonedElement) => {
      // El navegador ya ha renderizado los colores lab() a RGB
      // html2canvas usará los valores renderizados, no los estilos CSS originales
    },
  });

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('Canvas capture returned empty dimensions');
  }

  return canvas;
};

export const usePdfGenerator = () => {
  const generatePdfAlternative = useCallback(async (elementId: string, filename: string = 'invoice.pdf') => {
    try {
      ensureHtml2CanvasGlobal();
      await waitForFonts();
      await sleep(200);

      console.debug('[PDF] generatePdfAlternative invoked', { elementId, filename });

      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      console.debug('[PDF] generatePdfAlternative original element', {
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
      });

      const { node, cleanup } = createPrintableClone(element);
      
      // Esperar a que el clon esté completamente renderizado
      await sleep(300);
      
      try {
        const rect = node.getBoundingClientRect();
        console.debug('[PDF] Alternative capture dimensions', {
          width: rect.width,
          height: rect.height,
          scrollWidth: node.scrollWidth,
          scrollHeight: node.scrollHeight,
        });
        
        if (rect.width === 0 || rect.height === 0) {
          throw new Error('Clone has zero dimensions');
        }
        
        const { imgData, width, height } = await captureWithDomToImage(node);
        console.debug('[PDF] Alternative dom-to-image result', { width, height });
        
        if (!imgData || imgData === 'data:,') {
          throw new Error('Failed to generate image data');
        }
        
        createPdfFromImage(imgData, width, height, filename);
        return true;
      } finally {
        cleanup();
      }
    } catch (error) {
      console.error('Error in alternative PDF generation:', error);
      throw error;
    }
  }, []);

  const generatePdf = useCallback(
    async (elementId: string, filename: string = 'invoice.pdf') => {
      ensureHtml2CanvasGlobal();
      await waitForFonts();
      await sleep(200);

      console.debug('[PDF] generatePdf invoked', { elementId, filename });

      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element with ID "${elementId}" not found`);
        console.log(
          'Available elements with IDs:',
          Array.from(document.querySelectorAll('[id]')).map((el) => el.id)
        );
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      console.debug('[PDF] generatePdf original element', {
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
      });

      const { node, cleanup } = createPrintableClone(element);
      
      // Esperar a que el clon esté completamente renderizado
      await sleep(300);
      
      console.debug('[PDF] Printable clone created', {
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
        console.debug('[PDF] Primary capture dimensions', {
          width: rect.width,
          height: rect.height,
          scrollWidth: node.scrollWidth,
          scrollHeight: node.scrollHeight,
        });
        
        if (rect.width === 0 || rect.height === 0) {
          throw new Error('Clone has zero dimensions');
        }
        
        const canvas = await captureWithHtml2Canvas(node);
        console.debug('[PDF] html2canvas result', { width: canvas.width, height: canvas.height });
        
        if (canvas.width === 0 || canvas.height === 0) {
          throw new Error('Canvas has zero dimensions');
        }
        
        const imgData = canvas.toDataURL('image/png');
        if (!imgData || imgData === 'data:,') {
          throw new Error('Failed to generate image data');
        }
        
        createPdfFromImage(imgData, canvas.width, canvas.height, filename);
        return true;
      } catch (error) {
        console.error('Primary PDF generation failed, attempting fallback:', error);
        cleanup();
        cleaned = true;
        return await generatePdfAlternative(elementId, filename);
      } finally {
        if (!cleaned) {
          cleanup();
        }
      }
    },
    [generatePdfAlternative]
  );

  return { generatePdf, generatePdfAlternative };
};
