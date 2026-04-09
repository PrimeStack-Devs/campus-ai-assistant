import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

// ✅ type-safe icon mapping
const icons: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  index: "home",
  chat: "chatbubble",
  events: "calendar",
  about: "information-circle",
};

const TabLayout = () => (
  <Tabs
    screenOptions={({ route }) => ({
      headerShown: false,

      tabBarIcon: ({ color, size }) => (
        <Ionicons
          name={icons[route.name]}
          size={size}
          color={color}
        />
      ),

      tabBarActiveTintColor: "#4f39f6",
      tabBarInactiveTintColor: "#99A1Af",

      tabBarStyle: {
        backgroundColor: "#fffeff",
        borderTopWidth: 0,
        height: 60,
      },
    })}
  >
    <Tabs.Screen name="index" options={{ title: "Home" }} />
    <Tabs.Screen name="chat" options={{ title: "Chat" }} />
    <Tabs.Screen name="events" options={{ title: "Events" }} />
    <Tabs.Screen name="about" options={{ title: "About" }} />
  </Tabs>
);

export default TabLayout;