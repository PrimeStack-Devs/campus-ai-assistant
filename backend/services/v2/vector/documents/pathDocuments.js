import { Document } from "@langchain/core/documents";

export function createPathDocuments(paths = [], category) {
  return paths.map(
    (pathItem) =>
      new Document({
        pageContent: `Route from ${pathItem.from_name} to ${
          pathItem.to_name
        }. Distance: ${pathItem.distance_m}m. Time: ${
          pathItem.walk_minutes
        } min. Directions: ${
          pathItem.route_description
        }. Landmarks: ${(pathItem.landmarks || []).join(", ")}`,
        metadata: { ...pathItem, category },
      }),
  );
}
