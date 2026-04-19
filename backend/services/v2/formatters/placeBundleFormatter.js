export function formatPlaceBundle(placeBundle) {
  if (!placeBundle) return "";

  return `
Structured Campus Data Bundle:
- Building: ${placeBundle.destination.name} (${placeBundle.destination.code})
- Description: ${placeBundle.destination.description}
- Zone: ${placeBundle.destination.zone}
- Floors: ${placeBundle.destination.floors}
- Coordinates: lat ${placeBundle.destination.coordinates.lat}, lng ${placeBundle.destination.coordinates.lng}
- Nearby buildings: ${(placeBundle.destination.nearby || []).join(", ")}
- Route label: ${placeBundle.route?.label || "Not available"}
- Route summary: ${placeBundle.route?.summary || "Not available"}
- Walking distance: ${placeBundle.route?.distance_m ?? "Unknown"} metres
- Walking time: ${placeBundle.route?.walk_minutes ?? "Unknown"} minutes
- Departments inside: ${
    (placeBundle.related_departments || [])
      .map(
        (department) =>
          `${department.name}${
            department.floor !== undefined ? ` (Floor ${department.floor})` : ""
          }`,
      )
      .join(", ") || "None listed"
  }
`.trim();
}
