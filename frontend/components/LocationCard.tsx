'use client';

import { MapPreview } from './MapPreview';
import { DirectionsButton } from './DirectionsButton';

interface LocationData {
  name: string;
  building?: string;
  floor?: string;
  latitude: number;
  longitude: number;
}

interface LocationCardProps {
  location: LocationData;
}

export function LocationCard({ location }: LocationCardProps) {
  const handleViewOnMaps = () => {
    const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Location Header */}
      <div className="mb-4">
        <div className="flex items-start gap-2">
          <span className="text-xl">📍</span>
          <div>
            <h4 className="font-semibold text-gray-900">{location.name}</h4>
            {location.building && (
              <p className="text-sm text-gray-600">
                {location.building}
                {location.floor && ` – ${location.floor}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Map Preview */}
      <div className="mb-4">
        <MapPreview
          latitude={location.latitude}
          longitude={location.longitude}
          locationName={location.name}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleViewOnMaps}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
          aria-label={`View ${location.name} on Google Maps`}
        >
          View on Maps
        </button>
        <DirectionsButton
          latitude={location.latitude}
          longitude={location.longitude}
          locationName={location.name}
        />
      </div>
    </div>
  );
}
