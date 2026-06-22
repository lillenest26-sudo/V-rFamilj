import { useEffect, useState } from 'react';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  error?: string;
}

export function useGeoLocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({
        latitude: 59.3293,
        longitude: 18.0686,
        city: 'Stockholm',
        error: 'Geolocation not supported',
      });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get city name from reverse geocoding
        let city = 'Okänd plats';
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          city = data.address?.city || data.address?.town || data.address?.village || 'Okänd plats';
        } catch (err) {
          console.log('Could not fetch city name:', err);
        }

        setLocation({ latitude, longitude, city });
        setLoading(false);
      },
      (error) => {
        console.log('Geolocation error:', error);
        // Fallback to Stockholm
        setLocation({
          latitude: 59.3293,
          longitude: 18.0686,
          city: 'Stockholm',
          error: error.message,
        });
        setLoading(false);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
      }
    );
  }, []);

  return { location, loading };
}
