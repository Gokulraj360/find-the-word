import { EngineMatrix } from "../engine/matrix.js";

export type CategoryPackId = "all" | "sports" | "electronics" | "food" | "animals";

export interface CategoryPackInfo {
  id: CategoryPackId;
  title: string;
  description: string;
  itemCount: number;
  sampleItems: string[];
}

export const CATEGORY_PACK_DEFINITIONS: Record<
  Exclude<CategoryPackId, "all">,
  {
    title: string;
    description: string;
    entityIds: number[];
  }
> = {
  sports: {
    title: "Sports & Athletics",
    description: "Athletic gear, tournament balls, running shoes, and sports champions.",
    entityIds: [3, 4, 18, 53, 75, 89, 90, 96, 97, 98, 99]
    // Ronaldo, Messi, Serena Williams, Bicycle, Running Shoes, Skateboard, Basketball, Cricket Ball, Football, Tennis Ball, Volleyball
  },
  electronics: {
    title: "Electronics & Tech",
    description: "Smartphones, computers, audio gadgets, cameras, appliances, and tech pioneers.",
    entityIds: [6, 12, 24, 37, 51, 52, 58, 59, 64, 69, 70, 71, 72, 77, 81, 82, 83, 88, 92, 93, 95, 103]
    // Musk, Jobs, Gates, Iron Man, Smartphone, Laptop, Microwave, Watch, Camera, Fridge, TV, Headphones, Lamp, Flashlight, Elec Guitar, Toaster, Vacuum, Drone, Hair Dryer, Blender, Thermometer, Mouse
  },
  food: {
    title: "Food & Culinary",
    description: "Fresh produce, culinary knives, kitchen appliances, and culinary icons.",
    entityIds: [20, 55, 58, 63, 69, 80, 82, 93, 101, 102]
    // Gordon Ramsay, Coffee Mug, Microwave, Knife, Fridge, Water Bottle, Toaster, Blender, Apple, Tomato
  },
  animals: {
    title: "Animals & Creatures",
    description: "Iconic creatures, legendary beast-themed heroes, and animal champions.",
    entityIds: [28, 30, 34, 35, 36, 43, 44, 47]
    // Batman, Spider-Man, Pikachu, Sonic, Mickey Mouse, Yoda, SpongeBob, Shrek
  }
};

/**
 * Returns matrix indices for entities belonging to a specific category pack and domain.
 */
export function getCategoryPackIndices(
  pack: CategoryPackId = "all",
  matrix: EngineMatrix,
  domain?: "character" | "object"
): number[] {
  let baseIndices: number[];

  if (domain === "object") {
    baseIndices = matrix.objectEntityIndices;
  } else if (domain === "character") {
    baseIndices = matrix.characterEntityIndices;
  } else {
    baseIndices = Array.from({ length: matrix.numEntities }, (_, i) => i);
  }

  if (pack === "all" || !CATEGORY_PACK_DEFINITIONS[pack]) {
    return baseIndices;
  }

  const allowedIds = new Set(CATEGORY_PACK_DEFINITIONS[pack].entityIds);
  const filteredIndices: number[] = [];

  for (const idx of baseIndices) {
    const entity = matrix.entities[idx];
    if (entity && allowedIds.has(entity.id)) {
      filteredIndices.push(idx);
    }
  }

  // If filtered pool is too small (e.g. strict domain filter left too few), fallback to pack base
  if (filteredIndices.length < 3) {
    for (const idx of Array.from({ length: matrix.numEntities }, (_, i) => i)) {
      const entity = matrix.entities[idx];
      if (entity && allowedIds.has(entity.id)) {
        filteredIndices.push(idx);
      }
    }
  }

  return filteredIndices;
}

/**
 * Returns public metadata and sample items for all available category packs.
 */
export function getAvailableCategoryPacks(matrix: EngineMatrix): CategoryPackInfo[] {
  const packs: CategoryPackInfo[] = [
    {
      id: "all",
      title: "All Categories",
      description: "Full spectrum deduction across the entire knowledge base.",
      itemCount: matrix.numEntities,
      sampleItems: ["Albert Einstein", "Smartphone", "Cricket Ball", "Taylor Swift"]
    }
  ];

  for (const [id, def] of Object.entries(CATEGORY_PACK_DEFINITIONS) as [
    Exclude<CategoryPackId, "all">,
    (typeof CATEGORY_PACK_DEFINITIONS)[Exclude<CategoryPackId, "all">]
  ][]) {
    const indices = getCategoryPackIndices(id, matrix);
    const samples = indices
      .slice(0, 4)
      .map((i) => matrix.entities[i]?.name)
      .filter(Boolean);

    packs.push({
      id,
      title: def.title,
      description: def.description,
      itemCount: indices.length,
      sampleItems: samples
    });
  }

  return packs;
}
