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
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mb-4">
        <div className="flex items-start gap-2">
          <span className="text-xl">Map</span>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{location.name}</h4>
            {location.building && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {location.building}
                {location.floor && ` - ${location.floor}`}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <MapPreview
          latitude={location.latitude}
          longitude={location.longitude}
          locationName={location.name}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleViewOnMaps}
          className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
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
