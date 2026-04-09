import { icons } from "@/constants/icon";
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
export default function About() {
  const router = useRouter();

 const features = [
  {
    icon: (color: string) => (
      <Ionicons name="sparkles-outline" size={24} color={color} />
    ),
    title: "AI-Powered Assistance",
    description: "Get instant, intelligent answers to all your campus questions",
  },
  {
    icon: (color: string) => (
      <Feather name="book-open" size={24} color={color} />
    ),
    title: "Personalized Experience",
    description: "Tailored recommendations based on your academic journey",
  },
  {
    icon: (color: string) => (
      <Feather name="users" size={24} color={color} />
    ),
    title: "Campus Integration",
    description: "Seamlessly connected with all university systems",
  },
  {
    icon: (color: string) => (
      <Feather name="zap" size={24} color={color} />
    ),
    title: "Real-Time Updates",
    description: "Stay informed with instant notifications and alerts",
  },
];
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View style={{ padding: 20 }}>

        {/* 🔥 Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 30 }}>

          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            About UniBuddy
          </Text>
        </View>

        {/* 🔥 Hero */}
        <View
          
          className="bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 mb-10 shadow-xl shadow-indigo-500/25 relative overflow-hidden mt-5"
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.3)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 15,
            }}
            
          >
            <Image source={icons.ai_icon} style={{ width: 30, height: 30 }} />
          </View>

          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
            Your Intelligent Campus Companion
          </Text>

          <Text style={{ color: "#c7d2fe", marginTop: 10 }}>
            UniBuddy is an AI-powered assistant designed to make your university
            experience seamless, from course registration to event discovery.
          </Text>
        </View>

        {/* 🔥 Features */}
        <View style={{ marginTop: 30 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              color: "#9ca3af",
              marginBottom: 12,
            }}
          >
            WHAT WE OFFER
          </Text>

          {features.map((item, i) => (
            <View
              key={i}
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 16,
                marginBottom: 10,
                flexDirection: "row",
                gap: 12,
              }}
              className="bg-white/60 backdrop-blur-sm rounded-[20px] p-6 shadow-md"
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  backgroundColor: "#eef2ff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
               {item.icon("#4f46e5")}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                  {item.title}
                </Text>
                <Text style={{ color: "#6b7280", fontSize: 13 }}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 🔥 Stats */}
        <View
          
          className="bg-white/60 backdrop-blur-sm rounded-[20px] p-7 my-6 shadow-md"
        >
          <Text style={{ fontWeight: "bold", marginBottom: 12 }}>
            Impact
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>15K+</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Users</Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>50K+</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Answers</Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>98%</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Satisfaction</Text>
            </View>
          </View>
        </View>

        {/* 🔥 Version */}
        <View
          
          className="bg-white/60 backdrop-blur-sm rounded-[20px] p-6 mb-10 shadow-md"
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text>Version</Text>
            <Text>2.1.0</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <Text>Last Updated</Text>
            <Text>April 2, 2026</Text>
          </View>
        </View>

        {/* 🔥 Contact */}
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text style={{ color: "#6b7280" }}>Need help?</Text>
          <Text style={{ color: "#6366f1", fontWeight: "bold", marginTop: 4 }}>
            support@unibuddy.edu
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}