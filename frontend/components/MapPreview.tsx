'use client';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

export function MapPreview({ latitude, longitude, locationName }: MapPreviewProps) {
  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`;

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
      <iframe
        width="100%"
        height="300"
        src={mapUrl}
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map of ${locationName}`}
      />
    </div>
  );
}
