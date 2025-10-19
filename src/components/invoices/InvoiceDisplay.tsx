'use client';

import React, { useState } from 'react';
import { Invoice } from '@/types';
import { formatCurrency, formatDate, getInvoiceStatusColor } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePdfGenerator } from '@/hooks/usePdfGenerator';
import { PrinterIcon, PencilIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface InvoiceDisplayProps {
  invoice: Invoice;
  onPrint?: () => void;
  onEdit?: () => void;
}

export default function InvoiceDisplay({ invoice, onPrint, onEdit }: InvoiceDisplayProps) {
  const { t } = useLanguage();
  const { generatePdf } = usePdfGenerator();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const filename = `invoice-${invoice.invoiceNumber}.pdf`;
      await generatePdf('invoice-container', filename);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div id="invoice-container" className="invoice-container bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="invoice-header bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="invoice-title text-2xl font-bold text-gray-900">
              {t('invoice.title')} #{invoice.invoiceNumber}
            </h1>
            <div className="mt-2 flex items-center space-x-4">
              <span className={`invoice-status inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}>
                {t(`invoice.status.${invoice.status}`)}
              </span>
              <span className="text-sm text-gray-500">
                {t(`invoice.type.${invoice.type}`)}
              </span>
            </div>
          </div>
          <div className="flex space-x-2 no-print action-buttons">
            {onEdit && (
              <button
                onClick={onEdit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </button>
            )}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
            </button>
            {onPrint && (
              <button
                onClick={onPrint}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                {t('common.print')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="px-6 py-6">
        <div className="invoice-addresses grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* From */}
          <div className="address-section">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('invoice.from')}</h3>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{invoice.contractorName}</p>
              <p>{invoice.contractorAddress}</p>
              <p>{invoice.contractorPhone}</p>
              <p>{invoice.contractorEmail}</p>
              {invoice.contractorLicense && (
                <p className="mt-2">
                  <span className="font-medium">License:</span> {invoice.contractorLicense}
                </p>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="address-section">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('invoice.billTo')}</h3>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{invoice.clientName}</p>
              <p>{invoice.clientAddress}</p>
              <p>{invoice.clientPhone}</p>
              <p>{invoice.clientEmail}</p>
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="invoice-details mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="invoice-detail">
            <dt className="text-sm font-medium text-gray-500">{t('invoice.invoiceNumber')}</dt>
            <dd className="mt-1 text-sm text-gray-900">{invoice.invoiceNumber}</dd>
          </div>
          <div className="invoice-detail">
            <dt className="text-sm font-medium text-gray-500">{t('invoice.issueDate')}</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(invoice.issueDate)}</dd>
          </div>
          <div className="invoice-detail">
            <dt className="text-sm font-medium text-gray-500">{t('invoice.dueDate')}</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(invoice.dueDate)}</dd>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('invoice.description')}</h3>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="invoice-table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.description')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.quantity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.unit')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.unitPrice')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.total')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="invoice-totals mt-8 flex justify-end">
          <div className="totals-container w-full max-w-sm">
            <div className="bg-gray-50 px-6 py-4 rounded-lg">
              <div className="total-row flex justify-between text-sm">
                <span className="text-gray-600">{t('invoice.subtotal')}</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="total-row flex justify-between text-sm mt-2">
                <span className="text-gray-600">
                  {t('invoice.tax')} ({invoice.taxRate}%)
                </span>
                <span className="font-medium">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="total-row final flex justify-between text-lg font-bold mt-4 pt-4 border-t border-gray-200">
                <span>{t('invoice.grandTotal')}</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="invoice-footer mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {invoice.notes && (
              <div className="footer-section">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('invoice.notes')}</h3>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div className="footer-section">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('invoice.terms')}</h3>
                <p className="text-sm text-gray-600">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
