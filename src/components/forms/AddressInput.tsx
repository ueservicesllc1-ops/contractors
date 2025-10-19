'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';

interface AddressInputProps {
  value: string;
  onChange: (address: string, details?: any) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function AddressInput({ 
  value, 
  onChange, 
  placeholder = "Escribe tu dirección...", 
  className = "",
  required = false 
}: AddressInputProps) {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const predictionsRef = useRef<HTMLDivElement>(null);
  const { isLoaded, getPlacePredictions, getPlaceDetails } = useGooglePlaces();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (isLoaded && inputValue.length > 2) {
      setIsLoading(true);
      getPlacePredictions(inputValue, (predictions: any[]) => {
        setPredictions(predictions || []);
        setShowPredictions(true);
        setIsLoading(false);
      });
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handlePredictionSelect = (prediction: any) => {
    setShowPredictions(false);
    onChange(prediction.description);
    
    if (isLoaded) {
      getPlaceDetails(prediction.place_id, (place: any) => {
        onChange(prediction.description, place);
      });
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        required={required}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-2.5">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {showPredictions && predictions.length > 0 && (
        <div
          ref={predictionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {predictions.map((prediction, index) => (
            <div
              key={prediction.place_id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handlePredictionSelect(prediction)}
            >
              <div className="text-sm text-gray-900">
                {prediction.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
