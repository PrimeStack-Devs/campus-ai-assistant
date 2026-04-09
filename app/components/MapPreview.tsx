import { View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

export function MapPreview({ latitude, longitude, locationName }: MapPreviewProps) {
  return (
    <View style={{ height: 200, borderRadius: 12, overflow: "hidden" }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        {/* 🌍 Free OpenStreetMap tiles */}
       <UrlTile
  urlTemplate="https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
  maximumZ={19}
/>

        {/* 📍 Marker */}
        <Marker coordinate={{ latitude, longitude }} title={locationName} />
      </MapView>
    </View>
  );
}