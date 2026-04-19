import { Document } from "@langchain/core/documents";
import { formatValue } from "../utils/text.js";

export const createScheduleDocuments = (rawData, category) => {
  const docs = [];

  const pushScheduleDoc = (item, extraFields = {}) => {
    const searchableFields = [
      `Category: ${category}`,
      `Id: ${formatValue(item.id)}`,
      `Name: ${formatValue(item.name || item.label || item.title || item.route_name || item.event)}`,
      `Code: ${formatValue(item.code || item.short_name || item.route_number)}`,
      `Type: ${formatValue(item.type || item.designation || item.role || item.schedule_type)}`,
      `Department: ${formatValue(item.department_name || item.department_id)}`,
      `Location: ${formatValue(item.building_name)} ${
        item.floor !== undefined ? `Floor ${item.floor}` : ""
      }`.trim(),
      `Room: ${formatValue(item.room)}`,
      `Contact: ${formatValue(item.contact_phone || item.phone)} ${formatValue(
        item.contact_email || item.email,
      )}`.trim(),
      `Description: ${formatValue(item.description || item.content || item.notes)}`,
      `Aliases: ${formatValue(item.aliases)}`,
      `Keywords: ${formatValue(item.tags)}`,
      `Programs: ${formatValue(item.programs)}`,
      `Subjects: ${formatValue(item.subjects || item.subjects_taught)}`,
      `Institutes: ${formatValue(item.institutes)}`,
      `Nearby: ${formatValue(item.nearby)}`,
      `Facilities: ${formatValue(item.facilities)}`,
      `Rules: ${formatValue(item.rules)}`,
      `Timings: ${formatValue(item.timings || item.timing)}`,
      `Frequency: ${formatValue(item.frequency)}`,
      `Stops: ${formatValue(item.stops)}`,
      `Return Schedule: ${formatValue(item.return_schedule)}`,
      `HOD: ${formatValue(item.hod)}`,
      ...Object.entries(extraFields).map(
        ([key, value]) => `${key}: ${formatValue(value)}`,
      ),
    ].filter((line) => !line.endsWith(": "));

    docs.push(
      new Document({
        pageContent: searchableFields.join("\n"),
        metadata: { ...item, ...extraFields, category },
      }),
    );
  };

  (rawData.bus_routes || []).forEach((route) => {
    pushScheduleDoc(route, {
      schedule_type: "bus_route",
    });
  });

  (rawData.office_hours || []).forEach((officeHour) => {
    pushScheduleDoc(officeHour, {
      schedule_type: "office_hours",
    });
  });

  const academicCalendar = rawData.academic_calendar || {};

  Object.entries(academicCalendar).forEach(([key, value]) => {
    if (key === "important_dates") {
      (value || []).forEach((eventItem, index) => {
        pushScheduleDoc(
          {
            id: `important_date_${index + 1}`,
            name: eventItem.event,
            description: eventItem.description,
            date: eventItem.date,
            aliases: [eventItem.event],
          },
          {
            schedule_type: "important_date",
            academic_year: academicCalendar.current_academic_year,
          },
        );
      });
      return;
    }

    if (key === "holidays") {
      pushScheduleDoc(
        {
          id: "academic_holidays",
          name: "Holiday Calendar",
          description: value.note,
          aliases: ["holiday list", "holiday calendar", "holidays"],
          rules: value.fixed_national_holidays || [],
        },
        {
          schedule_type: "holidays",
          academic_year: academicCalendar.current_academic_year,
        },
      );
      return;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      pushScheduleDoc(
        {
          id: key,
          name: value.name || key.replace(/_/g, " "),
          description: `${value.name || key.replace(/_/g, " ")} for ${
            academicCalendar.current_academic_year || "the current academic year"
          }`,
          aliases: [
            key.replace(/_/g, " "),
            key,
            value.name,
            key === "semester_1" ? "semester 1" : "",
            key === "semester_2" ? "semester 2" : "",
          ].filter(Boolean),
        },
        {
          schedule_type: "academic_calendar",
          academic_year: academicCalendar.current_academic_year,
          ...value,
        },
      );
    }
  });

  return docs;
};
