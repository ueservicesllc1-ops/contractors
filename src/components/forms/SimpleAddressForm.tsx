'use client';

import React from 'react';

interface SimpleAddressFormProps {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  onAddressChange: (field: string, value: string) => void;
  className?: string;
}

export default function SimpleAddressForm({
  address,
  city,
  state,
  zipCode,
  onAddressChange,
  className = ""
}: SimpleAddressFormProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección *
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => onAddressChange('address', e.target.value)}
          placeholder="Escribe tu dirección..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ciudad *
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => onAddressChange('city', e.target.value)}
            placeholder="Ciudad"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado *
          </label>
          <input
            type="text"
            value={state}
            onChange={(e) => onAddressChange('state', e.target.value)}
            placeholder="Estado"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código Postal *
          </label>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => onAddressChange('zipCode', e.target.value)}
            placeholder="Código Postal"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>
    </div>
  );
}
