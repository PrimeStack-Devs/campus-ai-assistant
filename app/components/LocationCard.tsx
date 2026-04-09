import { MapPreview } from "@/components/MapPreview";
import { DirectionsButton } from "@/components/DirectionsButton";
import { Linking, Pressable, Text, View } from "react-native";

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
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    Linking.openURL(mapsUrl);
  };

  return (
    <View className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      
      {/* Header */}
      <View className="mb-4">
        <Text className="text-lg font-semibold">{location.name}</Text>

        {location.building && (
          <Text className="text-sm text-gray-500">
            {location.building}
            {location.floor && ` - ${location.floor}`}
          </Text>
        )}
      </View>

      {/* Map */}
      <View className="mb-4">
        <MapPreview
          latitude={location.latitude}
          longitude={location.longitude}
          locationName={location.name}
        />
      </View>

      {/* Buttons */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={handleViewOnMaps}
          className="flex-1 px-4 py-2 bg-gray-300 rounded-lg"
        >
          <Text className="text-center font-medium">
            View on Maps
          </Text>
        </Pressable>

        <DirectionsButton
          latitude={location.latitude}
          longitude={location.longitude}
          locationName={location.name}
        />
      </View>
    </View>
  );
}