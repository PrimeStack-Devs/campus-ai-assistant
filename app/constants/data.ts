import { Ionicons } from "@expo/vector-icons";
type IconName = React.ComponentProps<typeof Ionicons>["name"];
export const tabs: {
  name: string;
  title: string;
  icon: IconName;
}[]= [
  { name: "home", title: "Home", icon: "home" },
  { name: "chat", title: "Chat", icon: "chatbubble" },
  { name: "events", title: "Events", icon: "calendar" },
  { name: "about", title: "About", icon: "information-circle" },
];
