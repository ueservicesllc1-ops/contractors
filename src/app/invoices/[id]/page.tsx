'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { useParams, useRouter } from 'next/navigation';
import { Invoice } from '@/types';
import { formatCurrency, formatDate, getInvoiceStatusColor, getInvoiceStatusText, isInvoiceOverdue, calculateDaysOverdue } from '@/lib/utils';
import { useProfile } from '@/contexts/ProfileContext';
import { InvoiceService } from '@/lib/invoiceService';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePdfGenerator } from '@/hooks/usePdfGenerator';
import { PrinterIcon, PencilIcon, ArrowLeftIcon, CheckIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';


export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const { generatePdf, generatePdfAlternative } = usePdfGenerator();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'check',
    reference: '',
    notes: ''
  });

  // Inicializar el monto del pago cuando se abre el formulario
  useEffect(() => {
    if (showPaymentForm && invoice) {
      setPaymentData(prev => ({
        ...prev,
        amount: invoice.balance
      }));
    }
  }, [showPaymentForm, invoice]);

  // Actualizar datos del contratista con información del perfil
  const invoiceWithProfile = useMemo(() => {
    if (!invoice) return null;
    
    return {
      ...invoice,
      contractorName: profile?.companyName || profile?.contactName || invoice.contractorName,
      contractorAddress: profile ? `${profile.address}, ${profile.city}, ${profile.state} ${profile.zipCode}` : invoice.contractorAddress,
      contractorPhone: profile?.contactPhone || invoice.contractorPhone,
      contractorEmail: profile?.contactEmail || invoice.contractorEmail,
      contractorLicense: profile?.njContractorLicense || invoice.contractorLicense,
      // Recalcular balance en tiempo real
      balance: Math.max(0, (invoice?.total || 0) - (invoice?.amountPaid || 0)),
    };
  }, [invoice, profile]);

  // Cargar factura
  useEffect(() => {
    const loadInvoice = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const invoiceData = await InvoiceService.getInvoice(params.id as string);
        if (invoiceData) {
          setInvoice(invoiceData);
        } else {
          toast.error(t('invoice.notFound') || 'Factura no encontrada');
          router.push('/invoices');
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
        toast.error(t('invoice.loadError') || 'Error al cargar la factura');
        router.push('/invoices');
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600">{t('invoice.notFound') || 'Factura no encontrada'}</p>
        </div>
      </div>
    );
  }


  const isOverdue = invoiceWithProfile ? isInvoiceOverdue(invoiceWithProfile.dueDate) : false;
  const daysOverdue = isOverdue ? calculateDaysOverdue(invoiceWithProfile!.dueDate) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    
    try {
      setIsGeneratingPdf(true);
      
      const filename = `invoice-${invoice.invoiceNumber}.pdf`;
      
      // Crear una versión simplificada de la factura sin gradientes
      const createSimplifiedInvoice = () => {
        const originalElement = document.getElementById('invoice-container');
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
        const simplifiedElement = createSimplifiedInvoice();
        if (!simplifiedElement) {
          throw new Error('No se pudo crear el elemento simplificado');
        }
        
        // Agregar temporalmente al DOM
        simplifiedElement.style.position = 'absolute';
        simplifiedElement.style.left = '-9999px';
        simplifiedElement.style.top = '0';
        simplifiedElement.id = 'invoice-simplified';
        document.body.appendChild(simplifiedElement);
        
        // Usar método alternativo con elemento simplificado
        await generatePdfAlternative('invoice-simplified', filename);
        toast.success('PDF generado exitosamente');
        
        // Remover elemento temporal
        document.body.removeChild(simplifiedElement);
        
      } catch (error) {
        console.warn('Simplified method failed, trying original:', error);
        // Fallback al método original
        await generatePdfAlternative('invoice-container', filename);
        toast.success('PDF generado usando método alternativo');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    
    try {
      console.log('🔄 Marking invoice as paid from UI:', {
        id: invoice.id,
        number: invoice.invoiceNumber,
        currentStatus: invoice.status,
        total: invoice.total
      });
      
      await InvoiceService.markInvoiceAsPaid(invoice.id);
      
      // Actualizar el estado local
      setInvoice(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          status: 'paid' as const,
          paidDate: new Date(),
          amountPaid: prev.total,
          balance: 0
        };
        console.log('📝 Updated local invoice state:', {
          id: updated.id,
          number: updated.invoiceNumber,
          status: updated.status,
          total: updated.total
        });
        return updated;
      });
      
      toast.success('Factura marcada como pagada');
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Error al marcar la factura como pagada');
    }
  };

  const handleSendInvoice = () => {
    // In real app, this would send the invoice via email
    console.log('Sending invoice');
  };

  // Manejar el registro de pago
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !profile?.userId) return;

    try {
      setIsSubmittingPayment(true);
      
      console.log('💳 Processing payment:', {
        invoiceId: invoice.id,
        amount: paymentData.amount,
        method: paymentData.method,
        date: paymentData.paymentDate
      });

      // Crear el objeto de pago
      const paymentRecord = {
        amount: paymentData.amount,
        paymentDate: new Date(paymentData.paymentDate),
        paymentMethod: paymentData.method as 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other',
        reference: paymentData.reference,
        notes: paymentData.notes,
        invoiceId: invoice.id,
        userId: profile.userId
      };

      // Agregar el pago usando el servicio
      await InvoiceService.addPayment(profile.userId, invoice.id, paymentRecord);
      
      // Actualizar el estado local de la factura
      setInvoice(prev => {
        if (!prev) return null;
        const newAmountPaid = prev.amountPaid + paymentData.amount;
        const newBalance = Math.max(0, prev.total - newAmountPaid);
        const newStatus = newBalance <= 0 ? 'paid' : prev.status;
        
        return {
          ...prev,
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          paidDate: newBalance <= 0 ? new Date() : prev.paidDate
        };
      });

      // Mostrar mensaje de éxito
      toast.success('Pago registrado exitosamente');
      
      // Cerrar el formulario
      setShowPaymentForm(false);
      
      // Redirigir a la página de facturas después de un breve delay
      setTimeout(() => {
        router.push('/invoices');
      }, 1500);

    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error al registrar el pago');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Manejar cambios en el formulario de pago
  const handlePaymentDataChange = (field: string, value: string | number) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = () => {
    if (!invoiceWithProfile) return null;
    
    const status = isOverdue && invoiceWithProfile.status === 'sent' ? 'overdue' : invoiceWithProfile.status;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInvoiceStatusColor(status)} hide-on-print`}>
        {getInvoiceStatusText(status)}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/invoices')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
{t('common.back') || 'Volver'} a {t('navigation.invoices') || 'Facturas'}
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{invoiceWithProfile?.invoiceNumber || 'N/A'}</h1>
              <p className="text-gray-600">
{t(`invoice.type.${invoiceWithProfile?.type}`) || invoiceWithProfile?.type || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge()}
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Imprimir
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
            </button>
            <button
              onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Editar
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div id="invoice-container" className="bg-white shadow rounded-lg overflow-hidden">
        {/* Invoice Header */}
        <div className="px-6 py-8 bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contractor Info */}
            <div>
              <h2 className="text-lg font-semibold text-black mb-2">
                {invoiceWithProfile?.contractorName || 'N/A'}
              </h2>
              <div className="text-sm text-black space-y-1">
                <p>{invoiceWithProfile?.contractorAddress || 'N/A'}</p>
                <p>Tel: {invoiceWithProfile?.contractorPhone || 'N/A'}</p>
                <p>Email: {invoiceWithProfile?.contractorEmail || 'N/A'}</p>
                {invoiceWithProfile?.contractorLicense && (
                  <p>License: {invoiceWithProfile.contractorLicense}</p>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="text-right">
              <h1 className="text-2xl font-bold text-black mb-4">{t('invoice.title').toUpperCase()}</h1>
              <div className="text-sm text-black space-y-1">
                 <p><span className="font-medium text-black">{t('invoice.invoiceNumber')}:</span> {invoiceWithProfile?.invoiceNumber || 'N/A'}</p>
                 <p><span className="font-medium text-black">{t('invoice.issueDate')}:</span> {invoiceWithProfile?.issueDate ? formatDate(invoiceWithProfile.issueDate) : 'N/A'}</p>
                 <p><span className="font-medium text-black">{t('invoice.dueDate')}:</span> {invoiceWithProfile?.dueDate ? formatDate(invoiceWithProfile.dueDate) : 'N/A'}</p>
                 <p><span className="font-medium text-black">{t('invoice.paymentTerms')}:</span> {invoiceWithProfile?.paymentTerms || 'N/A'}</p>
                {isOverdue && (
                  <p className="text-red-200 font-medium bg-red-600 rounded px-2 py-1 inline-block">
                    Vencida hace {daysOverdue} días
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wide mb-2 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                {t('invoice.billTo')}:
              </h3>
              <div className="text-sm text-gray-900 bg-white rounded-lg p-4 shadow-sm">
                 <p className="font-semibold text-gray-900 text-base mb-2">{invoiceWithProfile?.clientName || 'N/A'}</p>
                 <p className="text-gray-600 mb-1">{invoiceWithProfile?.clientAddress || 'N/A'}</p>
                 <p className="text-gray-600 mb-1">📧 {invoiceWithProfile?.clientEmail || 'N/A'}</p>
                 {invoiceWithProfile?.clientPhone && <p className="text-gray-600">📞 {invoiceWithProfile.clientPhone}</p>}
              </div>
            </div>

            {/* Progress Billing Info */}
            {invoiceWithProfile?.progressBilling && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  {t('invoice.proposeBilling') || 'Facturación de Progreso'}:
                </h3>
                <div className="text-sm text-gray-900">
                  <p><span className="font-medium">Fase:</span> {invoiceWithProfile.progressBilling.phase}</p>
                  <p><span className="font-medium">Progreso:</span> {invoiceWithProfile.progressBilling.percentage}%</p>
                  <p><span className="font-medium">Monto:</span> {formatCurrency(invoiceWithProfile.progressBilling.amount)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="px-4 py-3">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-slate-400 to-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    {t('invoice.description')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    {t('invoice.quantity')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    {t('invoice.unit')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    {t('invoice.unitPrice')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    {t('invoice.total')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                 {invoiceWithProfile?.items?.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.unit}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-slate-50 border-t-2 border-blue-200">
          <div className="flex justify-end">
            <div className="w-72">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">{t('invoice.subtotal')}:</span>
                     <span className="text-sm font-medium text-gray-900">{formatCurrency(invoiceWithProfile?.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Impuesto ({invoiceWithProfile?.taxRate || 0}%):</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(invoiceWithProfile?.tax || 0)}</span>
                  </div>
                        <div className="border-t border-gray-300 pt-3">
                          <div className="flex justify-between">
                            <span className="text-base font-bold text-gray-900">{t('invoice.grandTotal')}:</span>
                            <span className="text-base font-bold text-black">{formatCurrency(invoiceWithProfile?.total || 0)}</span>
                          </div>
                        </div>
                  {invoiceWithProfile?.amountPaid && invoiceWithProfile.amountPaid > 0 && (
                  <div className="flex justify-between bg-green-50 border border-green-200 rounded p-2">
                    <span className="text-sm font-medium text-green-800">Pagado:</span>
                    <span className="text-sm font-bold text-green-900">{formatCurrency(invoiceWithProfile?.amountPaid || 0)}</span>
                  </div>
                )}
                {invoiceWithProfile?.balance && invoiceWithProfile.balance > 0 && (
                  <div className="flex justify-between bg-orange-50 border border-orange-200 rounded p-2">
                    <span className="text-sm font-medium text-orange-800">Balance Pendiente:</span>
                    <span className="text-sm font-bold text-orange-900">{formatCurrency(invoiceWithProfile?.balance || 0)}</span>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="px-6 py-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {invoice.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Notas:
                  </h3>
                  <p className="text-sm text-gray-900">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Términos y Condiciones:
                  </h3>
                  <p className="text-sm text-gray-900">{invoice.terms}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {invoice.status !== 'paid' && (
          <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              {invoice.status === 'draft' && (
                <button
                  onClick={handleSendInvoice}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Enviar Factura
                </button>
              )}
              {invoice.status === 'sent' && (
                <button
                  onClick={handleMarkAsPaid}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Marcar como Pagada
                </button>
              )}
              <button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {showPaymentForm ? 'Cancelar Pago' : 'Registrar Pago'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Pago</h3>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Monto del Pago
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount || invoice.balance}
                  onChange={(e) => handlePaymentDataChange('amount', parseFloat(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha del Pago
                </label>
                <input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => handlePaymentDataChange('paymentDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Método de Pago
                </label>
                <select 
                  value={paymentData.method}
                  onChange={(e) => handlePaymentDataChange('method', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="check">Cheque</option>
                  <option value="cash">Efectivo</option>
                  <option value="credit_card">Tarjeta de Crédito</option>
                  <option value="bank_transfer">Transferencia Bancaria</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Referencia
                </label>
                <input
                  type="text"
                  placeholder="Número de cheque, transacción, etc."
                  value={paymentData.reference}
                  onChange={(e) => handlePaymentDataChange('reference', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notas
              </label>
              <textarea
                rows={3}
                placeholder="Notas adicionales sobre el pago..."
                value={paymentData.notes}
                onChange={(e) => handlePaymentDataChange('notes', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingPayment}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingPayment ? 'Registrando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Botón de regresar al final */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => router.push('/invoices')}
          className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver a la Lista de Facturas
        </button>
      </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
