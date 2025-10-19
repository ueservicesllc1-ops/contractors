declare global {
  interface Window {
    initGooglePlaces: () => void;
    google: any;
  }
}

class GooglePlacesService {
  private static instance: GooglePlacesService;
  private isLoaded = false;
  private isLoading = false;
  private autocompleteService: any = null;
  private placesService: any = null;
  private callbacks: (() => void)[] = [];

  private constructor() {
    // Solo configurar callback global en el cliente
    if (typeof window !== 'undefined') {
      window.initGooglePlaces = () => {
        this.initializeServices();
      };
    }
  }

  public static getInstance(): GooglePlacesService {
    if (!GooglePlacesService.instance) {
      GooglePlacesService.instance = new GooglePlacesService();
    }
    return GooglePlacesService.instance;
  }

  public async loadGooglePlaces(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Google Places API can only be loaded in the browser'));
    }

    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.isLoading) {
      return new Promise((resolve) => {
        this.callbacks.push(resolve);
      });
    }

    this.isLoading = true;

    return new Promise((resolve, reject) => {
      // Verificar si Google Maps ya está cargado
      if (window.google && window.google.maps) {
        this.initializeServices();
        resolve();
        return;
      }

      // Verificar si el script ya está en el DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Esperar a que se cargue
        const checkLoaded = () => {
          if (window.google && window.google.maps) {
            this.initializeServices();
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // Crear el script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCvlxX6CDRX59URnoU9C8cQcqMNntTAUX0&libraries=places&callback=initGooglePlaces`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.initializeServices();
        resolve();
      };
      
      script.onerror = () => {
        this.isLoading = false;
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }

  private initializeServices(): void {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      this.autocompleteService = new window.google.maps.places.AutocompleteService();
      this.placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
      this.isLoaded = true;
      this.isLoading = false;
      
      // Ejecutar callbacks pendientes
      this.callbacks.forEach(callback => callback());
      this.callbacks = [];
    }
  }

  public getPlacePredictions(input: string, callback: (predictions: any[]) => void): void {
    if (!this.isLoaded || !this.autocompleteService) {
      console.warn('Google Places API not loaded yet');
      return;
    }

    if (input.length > 2) {
      this.autocompleteService.getPlacePredictions(
        {
          input,
          types: ['address'],
        },
        callback
      );
    }
  }

  public getPlaceDetails(placeId: string, callback: (place: any) => void): void {
    if (!this.isLoaded || !this.placesService) {
      console.warn('Google Places API not loaded yet');
      return;
    }

    this.placesService.getDetails(
      {
        placeId,
        fields: ['address_components', 'formatted_address', 'geometry'],
      },
      callback
    );
  }

  public isReady(): boolean {
    return this.isLoaded;
  }
}

export const googlePlacesService = GooglePlacesService.getInstance();
