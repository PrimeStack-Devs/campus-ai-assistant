import { icons } from "@/constants/icon";
import AntDesign from '@expo/vector-icons/AntDesign';
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
export default function Home() {
  const router = useRouter();

  const actions = [
    { icon: icons.hat, label: "Admissions", colors: ["#6366f1", "#3b82f6"] ,gradient: "from-indigo-500 to-blue-500"},
    { icon: icons.book, label: "Courses", colors: ["#3b82f6", "#06b6d4"] ,gradient: "from-blue-500 to-cyan-500"},
    { icon: icons.hostel, label: "Hostel", colors: ["#8b5cf6", "#6366f1"] ,gradient: "from-purple-500 to-indigo-500"},
    { icon: icons.calender, label: "Events", colors: ["#ec4899", "#8b5cf6"] ,gradient: "from-pink-500 to-purple-500"},
  ];

   

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F8F8F8" }}>
      <View style={{ padding: 20 }}>

        {/* 🔥 Header */}
        <View style={{ marginTop: 40, marginBottom: 30 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            
            <View
             
              className="bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[18px] flex items-center justify-center shadow-xl shadow-indigo-300 w-14 h-14"
            >
              <Image source={icons.ai_icon} style={{ width: 24, height: 24 }} />
            </View>

            <Text style={{ fontSize: 26, fontWeight: "bold" }}>
              Hi, I'm UniBuddy
            </Text>
          </View>

          <Text style={{ color: "#6b7280", marginTop: 10 }}>
            Your intelligent campus assistant, here to help with admissions,
            courses, events, and more.
          </Text>
        </View>

        {/* 🔥 Quick Actions */}
        <View style={{ marginBottom: 30 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              color: "#9ca3af",
              marginBottom: 15,
            }}
          >
            QUICK ACTIONS
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {actions.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push("/chat")}
                style={{
                  width: "48%",
                  borderRadius: 20,
                  padding: 20,
                  // backgroundColor: item.colors[0],
                }}
                className={`bg-linear-to-br ${item.gradient}`}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    backgroundColor: "rgba(255,255,255,0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <Image source={item.icon} style={{ width: 24, height: 24 }} />
                </View>

                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 🔥 Recent */}
        <View style={{ marginBottom: 30 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              color: "#9ca3af",
              marginBottom: 10,
            }}
          >
            RECENT
          </Text>

          {[
            { title: "Course registration help", time: "2h ago" },
            { title: "Hostel allocation query", time: "1d ago" },
            { title: "Exam schedule info", time: "2d ago" },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => router.push("/chat")}
             
              className="w-full flex flex-row justify-between items-center bg-white backdrop-blur-3xl rounded-[20px] p-5  shadow-md active:shadow-md active:bg-white transition-all active:scale-[0.98] mb-4"
            >
              <View>

              <Text style={{ fontWeight: "600" }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                {item.time}
              </Text>
              </View>
              <AntDesign name="right" size={12} color="gray-400" />
            </TouchableOpacity>
          ))}
        </View>

        {/* 🔥 Info Card */}
        <View
          style={{
            // backgroundColor: "#6366f1",
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
          }}
          className="bg-linear-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-[20px] p-6 shadow-xl shadow-indigo-300/25 relative overflow-hidden"
        >
          <Text style={{ color: "#fff", fontWeight: "bold", marginBottom: 6 }}>
            Spring Semester Registration
          </Text>

          <Text style={{ color: "#c7d2fe", marginBottom: 12 }}>
            Register for your courses before April 15th
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "rgba(255,255,255,0.3)",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Register Now
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🔥 Dashboard Button */}
        <TouchableOpacity
          onPress={() => router.push("/dashboard")}
         
          className="w-full flex flex-row justify-between items-center bg-white backdrop-blur-3xl rounded-[20px] p-5 shadow-md active:shadow-md active:bg-white transition-all active:scale-[0.98] mb-4"
        >
          <View>

          <Text style={{ fontWeight: "bold" }}>View Dashboard</Text>
          <Text style={{ color: "#6b7280" }}>
            Check your academic progress
          </Text>
          </View>
           <AntDesign name="right" size={12} color="gray-400" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}