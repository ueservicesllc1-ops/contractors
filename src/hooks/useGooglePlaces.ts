import { useState, useEffect } from 'react';
import { googlePlacesService } from '@/lib/googlePlacesService';

export const useGooglePlaces = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Solo cargar la API en el cliente
    if (typeof window === 'undefined') {
      return;
    }

    const loadAPI = async () => {
      try {
        await googlePlacesService.loadGooglePlaces();
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading Google Places API:', error);
      }
    };

    loadAPI();
  }, []);

  const getPlacePredictions = (input: string, callback: (predictions: any[]) => void) => {
    googlePlacesService.getPlacePredictions(input, callback);
  };

  const getPlaceDetails = (placeId: string, callback: (place: any) => void) => {
    googlePlacesService.getPlaceDetails(placeId, callback);
  };

  return {
    isLoaded: isLoaded && googlePlacesService.isReady(),
    getPlacePredictions,
    getPlaceDetails,
  };
};
