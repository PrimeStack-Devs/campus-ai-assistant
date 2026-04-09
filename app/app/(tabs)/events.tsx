import AntDesign from '@expo/vector-icons/AntDesign';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
export default function Events() {
  const router = useRouter();

  const events = [
    {
      id: "1",
      title: "Tech Innovation Summit 2026",
      date: "Apr 15",
      time: "10:00 AM",
      location: "Main Auditorium",
      description: "Join industry leaders discussing AI and future tech",
      tag: "Workshop",
      tagColor: "bg-green-100 text-green-700",
      thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
    },
    {
      id: "2",
      title: "Spring Cultural Festival",
      date: "Apr 20",
      time: "5:00 PM",
      location: "Campus Grounds",
      description: "Celebrate diversity with music, dance, and food",
      tag: "Cultural",
      tagColor: "bg-pink-100 text-pink-700",
      thumbnail: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
    },
    {
      id: "3",
      title: "Career Fair 2026",
      date: "Apr 25",
      time: "9:00 AM",
      location: "Sports Complex",
      description: "Meet with 50+ top companies and recruiters",
      tag: "Career",
      tagColor: "bg-blue-100 text-blue-700",
      thumbnail: "https://images.unsplash.com/photo-1511578314322-379afb476865",
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 20 }}>

        {/* 🔥 Header */}
        <View style={{ marginTop: 30, marginBottom: 20 }}>
          <Text style={{ fontSize: 26, fontWeight: "bold" }}>
            Campus Events
          </Text>
          <Text style={{ color: "#6b7280", marginTop: 5 }}>
            Discover workshops, festivals, and activities
          </Text>
        </View>

        {/* 🔥 Events List */}
        <View style={{ gap: 12 }}>
          {events.map((event) => (
            <TouchableOpacity
              key={event.id}
              onPress={() => router.push("/chat")}
              // style={{
              //   flexDirection: "row",
              //   backgroundColor: "#f9fafb",
              //   borderRadius: 20,
              //   padding: 12,
              //   alignItems: "flex-start",
              // }}
                className="w-full bg-white/60 backdrop-blur-sm rounded-[20px] p-5 flex flex-row items-start gap-4 shadow-md hover:shadow-lg hover:bg-white transition-all active:scale-[0.98]"
            >
              {/* Thumbnail */}
              <Image
                source={{ uri: event.thumbnail }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 16,
                  marginRight: 12,
                }}
                className="object-cover shadow-sm"
              />

              {/* Content */}
              <View style={{ flex: 1 }}
             >

                {/* Tag */}
                <View
                  style={{
                    alignSelf: "flex-start",
                    borderRadius: 8,
                    marginBottom: 6,
                  }}
                 
                >
                  <Text className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold mb-2.5 ${event.tagColor}`}>
                    {event.tag}
                  </Text>
                </View>

                {/* Title */}
                <Text style={{ fontWeight: "bold", fontSize: 14 }}>
                  {event.title}
                </Text>

                {/* Date & Time */}
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, }}>
                  {/* <Image source={icons.calender} style={{ width: 14, height: 14  }} /> */}
                <AntDesign name="clock-circle" size={12} color="gray" />
                  <Text style={{ fontSize: 12, color: "#6b7280",marginLeft: 4 }}>
                    {event.date} • {event.time}
                  </Text>
                </View>

                {/* Location */}
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2,marginLeft: -4 }}>
                  <EvilIcons name="location" size={20} color="gray" />
                  <Text style={{ fontSize: 12, color: "#6b7280", marginLeft: 4}}>
                    {event.location}
                  </Text>
                </View>

                {/* Description */}
                <Text
                  numberOfLines={2}
                  style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}
                >
                  {event.description}
                </Text>
              </View>

              {/* Arrow */}
               <AntDesign name="right" size={12} color="gray-400" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}