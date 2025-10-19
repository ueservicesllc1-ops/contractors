'use client';

import React, { useState } from 'react';
import AddressInput from './AddressInput';

interface AddressFormProps {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  onAddressChange: (field: string, value: string) => void;
  onFullAddressChange?: (fullAddress: string, details: any) => void;
  className?: string;
}

export default function AddressForm({
  address,
  city,
  state,
  zipCode,
  onAddressChange,
  onFullAddressChange,
  className = ""
}: AddressFormProps) {
  const [fullAddress, setFullAddress] = useState('');

  const handleAddressSelect = (selectedAddress: string, details?: any) => {
    onAddressChange('address', selectedAddress);
    
    if (details && details.address_components) {
      // Extraer información de la dirección usando Google Places API
      const components = details.address_components;
      
      let cityName = '';
      let stateName = '';
      let zipCodeValue = '';

      components.forEach((component: any) => {
        const types = component.types;
        
        if (types.includes('locality')) {
          cityName = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          stateName = component.short_name;
        } else if (types.includes('postal_code')) {
          zipCodeValue = component.long_name;
        }
      });

      // Actualizar todos los campos
      onAddressChange('city', cityName);
      onAddressChange('state', stateName);
      onAddressChange('zipCode', zipCodeValue);
      
      // Construir dirección completa
      const completeAddress = `${selectedAddress}, ${cityName}, ${stateName} ${zipCodeValue}`;
      setFullAddress(completeAddress);
      
      if (onFullAddressChange) {
        onFullAddressChange(completeAddress, details);
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección *
        </label>
        <AddressInput
          value={address}
          onChange={handleAddressSelect}
          placeholder="Escribe tu dirección..."
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
