import { Document } from "@langchain/core/documents";
import { formatValue } from "../utils/text.js";

export function createStandardDocuments(items = [], category) {
  return items.map((item) => {
    const searchableFields = [
      `Category: ${category}`,
      `Id: ${formatValue(item.id)}`,
      `Name: ${formatValue(item.name || item.label || item.title || item.route_name)}`,
      `Code: ${formatValue(item.code || item.short_name || item.route_number)}`,
      `Type: ${formatValue(item.type || item.designation || item.role)}`,
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
      `Timings: ${formatValue(item.timings)}`,
      `Frequency: ${formatValue(item.frequency)}`,
      `Stops: ${formatValue(item.stops)}`,
      `Return Schedule: ${formatValue(item.return_schedule)}`,
      `HOD: ${formatValue(item.hod)}`,
    ].filter((line) => !line.endsWith(": "));

    return new Document({
      pageContent: searchableFields.join("\n"),
      metadata: { ...item, category },
    });
  });
}
