import { LocationCard } from "@/components/LocationCard";
import { icons } from "@/constants/icon";
import { askCampusAI } from "@/services/chatApi"; // adjust path if needed
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
type Message = {
  id: string;
  text: string;
  sender: "user" | "ai";
  suggestions?: string[];
  location?: {
    name: string;
    building?: string;
    floor?: string;
    latitude: number;
    longitude: number;
  };
};

export default function Chat() {
 const [messages, setMessages] = useState<Message[]>([]);
 const [input, setInput] = useState("");
 const [loading, setLoading] = useState(false);
const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
  const loadMessages = async () => {
    const saved = await AsyncStorage.getItem("chat_messages");

    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        {
          id: "1",
          text: "Hi! I'm UniBuddy, your campus AI assistant. How can I help you today?",
          sender: "ai",
          suggestions: ["Course registration", "Hostel info", "Event calendar", "Exam schedule"],
        },
      ]);
    }
  };

loadMessages().then(() => setIsLoaded(true));
}, []);
 useEffect(() => {
  if (messages.length > 0) {
    AsyncStorage.setItem("chat_messages", JSON.stringify(messages));
  }
}, [messages]);

    const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await askCampusAI(input);
      console.log("API Response:", res);
      const aiMessage: Message = {
  id: (Date.now() + 1).toString(),
  text: res.answer,
  sender: "ai",
  location: res.location, // 🔥 IMPORTANT
};

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Something went wrong 😅",
          sender: "ai",
        },
      ]);
    }

    setLoading(false);
  };
  if (!isLoaded) return null;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80} // 🔥 important
    >

      <View style={{ flex: 1, backgroundColor: "#fff" }}>

        {/* 🔥 Header */}
        <View style={{ padding: 20, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View

            className="bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[18px] flex items-center justify-center shadow-xl shadow-indigo-300 w-14 h-14"
          >
            <Image source={icons.ai_icon} style={{ width: 24, height: 24 }} />
          </View>

          <View>
            <Text style={{ fontWeight: "bold" }}>UniBuddy</Text>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>
              Online • Instant response
            </Text>
          </View>
        </View>

        {/* 🔥 Messages */}
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12 }}
          style={{ flex: 1 }}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
              }}
            >
             <View
  style={{
    padding: 12,
    borderRadius: 16,
    backgroundColor:
      msg.sender === "user" ? "#6366f1" : "#f3f4f6",
  }}
>
  <Text
    style={{
      color: msg.sender === "user" ? "#fff" : "#111",
    }}
  >
    {msg.text}
  </Text>
</View>

{/* 🔥 ADD THIS */}
{msg.location && (
  <LocationCard location={msg.location} />
)}

              {/* 🔥 Suggestions */}
              {msg.suggestions && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {msg.suggestions.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setInput(s)}
                      style={{
                        backgroundColor: "#fff",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* 🔥 Input Bar */}
        <View
          style={{
            flexDirection: "row",
            padding: 10,
            // borderTopWidth: 1,
            borderColor: "#eee",
            alignItems: "center",
          }}

        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            style={{
              flex: 1,
              backgroundColor: "#f3f4f6",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 20,
            }}
            className="px-6 py-4 bg-white/50 backdrop-blur-xl"
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={loading}
            style={{
              marginLeft: 10,
              backgroundColor: loading ? "#9ca3af" : "#6366f1",
              width: 45,
              height: 45,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image source={icons.send} style={{ width: 20, height: 20, tintColor: "#fff" }} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}