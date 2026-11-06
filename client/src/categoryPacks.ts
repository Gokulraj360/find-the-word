export type CategoryPackId = "all" | "sports" | "electronics" | "food" | "animals";

export interface CategoryPackInfo {
  id: CategoryPackId;
  title: string;
  description: string;
  itemCount: number;
  sampleItems: string[];
}

export const DEFAULT_PACKS: CategoryPackInfo[] = [
  {
    id: "all",
    title: "All Categories",
    description: "Full spectrum deduction across the entire knowledge base.",
    itemCount: 103,
    sampleItems: ["Albert Einstein", "Smartphone", "Cricket Ball", "Taylor Swift"]
  },
  {
    id: "sports",
    title: "Sports & Athletics",
    description: "Athletic gear, tournament balls, running shoes, and sports champions.",
    itemCount: 11,
    sampleItems: ["Cristiano Ronaldo", "Cricket Ball", "Basketball", "Tennis Ball"]
  },
  {
    id: "electronics",
    title: "Electronics & Tech",
    description: "Smartphones, computers, audio gadgets, cameras, appliances, and tech pioneers.",
    itemCount: 22,
    sampleItems: ["Smartphone", "Laptop Computer", "Steve Jobs", "Television"]
  },
  {
    id: "food",
    title: "Food & Culinary",
    description: "Fresh produce, culinary knives, kitchen appliances, and culinary icons.",
    itemCount: 10,
    sampleItems: ["Apple", "Tomato", "Coffee Mug", "Kitchen Knife"]
  },
  {
    id: "animals",
    title: "Animals & Creatures",
    description: "Iconic creatures, legendary beast-themed heroes, and animal champions.",
    itemCount: 8,
    sampleItems: ["Pikachu", "Sonic the Hedgehog", "SpongeBob SquarePants", "Batman"]
  }
];

export async function fetchCategoryPacks(): Promise<CategoryPackInfo[]> {
  try {
    const res = await fetch("/api/packs");
    if (!res.ok) return DEFAULT_PACKS;
    const data = await res.json();
    return Array.isArray(data.packs) && data.packs.length > 0 ? data.packs : DEFAULT_PACKS;
  } catch {
    return DEFAULT_PACKS;
  }
}
