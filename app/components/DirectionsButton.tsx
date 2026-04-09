import { Linking, Pressable, Text } from "react-native";

interface DirectionsButtonProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

export function DirectionsButton({ latitude, longitude }: DirectionsButtonProps) {
  const handleGetDirections = async () => {
    const appUrl = `google.navigation:q=${latitude},${longitude}`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    const supported = await Linking.canOpenURL(appUrl);

    if (supported) {
      await Linking.openURL(appUrl); // opens Google Maps app
    } else {
      await Linking.openURL(webUrl); // fallback
    }
  };

  return (
    <Pressable
      onPress={handleGetDirections}
      className="flex-1 px-4 py-2 bg-blue-600 rounded-lg"
    >
      <Text className="text-white text-sm font-medium text-center">
        Get Directions
      </Text>
    </Pressable>
  );
}