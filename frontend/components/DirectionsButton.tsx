'use client';

interface DirectionsButtonProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

export function DirectionsButton({ latitude, longitude, locationName }: DirectionsButtonProps) {
  const handleGetDirections = () => {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(directionsUrl, '_blank');
  };

  return (
    <button
      onClick={handleGetDirections}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
      aria-label={`Get directions to ${locationName}`}
    >
      Get Directions
    </button>
  );
}
