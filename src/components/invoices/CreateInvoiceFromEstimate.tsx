'use client';

import React, { useState } from 'react';
import { Estimate } from '@/types';
import { formatCurrency, generateInvoiceNumber } from '@/lib/utils';
import { DocumentTextIcon, CheckIcon } from '@heroicons/react/24/outline';

interface CreateInvoiceFromEstimateProps {
  estimate: Estimate;
  onInvoiceCreated: (invoiceId: string) => void;
  onCancel: () => void;
}

export default function CreateInvoiceFromEstimate({ 
  estimate, 
  onInvoiceCreated, 
  onCancel 
}: CreateInvoiceFromEstimateProps) {
  const [invoiceType, setInvoiceType] = useState<'progress' | 'final'>('progress');
  const [progressPercentage, setProgressPercentage] = useState(30);
  const [isCreating, setIsCreating] = useState(false);

  const calculateInvoiceAmount = () => {
    if (invoiceType === 'final') {
      return estimate.total;
    } else {
      return (estimate.total * progressPercentage) / 100;
    }
  };

  const handleCreateInvoice = async () => {
    setIsCreating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const invoiceData = {
        id: Date.now().toString(),
        invoiceNumber: generateInvoiceNumber(),
        projectId: estimate.projectId,
        clientId: estimate.clientId || '',
        estimateId: estimate.id,
        status: 'draft',
        type: invoiceType,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentTerms: 'Net 30 days',
        items: estimate.sections.flatMap(section => 
          section.items.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            total: item.total,
            category: item.category
          }))
        ),
        subtotal: calculateInvoiceAmount(),
        tax: calculateInvoiceAmount() * (estimate.taxRate / 100),
        taxRate: estimate.taxRate,
        total: calculateInvoiceAmount(),
        progressBilling: invoiceType === 'progress' ? {
          phase: `Fase ${progressPercentage}%`,
          percentage: progressPercentage,
          amount: calculateInvoiceAmount()
        } : undefined,
        payments: [],
        amountPaid: 0,
        balance: calculateInvoiceAmount(),
        clientName: estimate.clientName || '',
        clientAddress: estimate.clientAddress || '',
        clientEmail: estimate.clientEmail || '',
        clientPhone: estimate.clientPhone || '',
        contractorName: estimate.contractorName || '',
        contractorAddress: estimate.contractorAddress || '',
        contractorPhone: estimate.contractorPhone || '',
        contractorEmail: estimate.contractorEmail || '',
        contractorLicense: estimate.contractorLicense || '',
        notes: `Factura generada desde estimado ${estimate.estimateNumber}`,
        terms: estimate.terms,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Invoice created from estimate:', invoiceData);
      onInvoiceCreated(invoiceData.id);
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="mt-2 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Crear Factura desde Estimado
            </h3>
            <div className="mt-2 px-7 py-3">
              <p className="text-sm text-gray-500">
                Estimado: <strong>{estimate.estimateNumber}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Total: <strong>{formatCurrency(estimate.total)}</strong>
              </p>
            </div>
          </div>
          
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Factura
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="invoiceType"
                    value="progress"
                    checked={invoiceType === 'progress'}
                    onChange={(e) => setInvoiceType(e.target.value as 'progress' | 'final')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Factura de Progreso</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="invoiceType"
                    value="final"
                    checked={invoiceType === 'final'}
                    onChange={(e) => setInvoiceType(e.target.value as 'progress' | 'final')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Factura Final</span>
                </label>
              </div>
            </div>

            {invoiceType === 'progress' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porcentaje de Progreso (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Monto de la Factura:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(calculateInvoiceAmount())}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateInvoice}
              disabled={isCreating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? 'Creando...' : 'Crear Factura'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
