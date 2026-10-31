import fs from "fs";
import path from "path";
import { getStorage } from "../server/db/storage.js";

interface WikidataItem {
  id: string; // QID
  name: string;
  description: string;
  imageUrl?: string;
  sitelinks: number;
  isFictional: boolean;
  gender?: string; // "male" | "female" | "other"
  isAlive?: boolean;
  birthYear?: number;
  deathYear?: number;
  occupations?: string[];
  country?: string;
}

const SPARQL_QUERY = `
SELECT ?item ?itemLabel ?itemDescription ?sitelinks ?image ?genderLabel ?birthYear ?deathYear ?occupations WHERE {
  {
    # Top humans by sitelinks
    ?item wdt:P31 wd:Q5 .
  } UNION {
    # Top fictional characters
    ?item wdt:P31/wdt:P279* wd:Q95074 .
  }
  ?item wikibase:sitelinks ?sitelinks .
  FILTER(?sitelinks > 80)
  OPTIONAL { ?item wdt:P18 ?image . }
  OPTIONAL { ?item wdt:P21 ?gender . }
  OPTIONAL { 
    ?item wdt:P569 ?dob . 
    BIND(YEAR(?dob) AS ?birthYear)
  }
  OPTIONAL { 
    ?item wdt:P570 ?dod . 
    BIND(YEAR(?dod) AS ?deathYear)
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 5000
`;

async function fetchFromWikidataSPARQL(limit = 100): Promise<WikidataItem[]> {
  console.log(`📡 Querying Wikidata SPARQL endpoint (Limit: ${limit})...`);
  const endpointUrl = "https://query.wikidata.org/sparql";
  const query = SPARQL_QUERY.replace("LIMIT 5000", `LIMIT ${limit}`);

  const url = `${endpointUrl}?query=${encodeURIComponent(query)}&format=json`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "CognitorBot/1.0 (https://github.com/example/cognitor; akinator-bayesian-engine)",
        Accept: "application/sparql-results+json"
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Wikidata SPARQL returned status ${response.status}: ${response.statusText}`);
    }

    const data: any = await response.json();
    const bindings = data.results.bindings || [];

    const items: WikidataItem[] = bindings.map((b: any) => {
      const qid = b.item.value.split("/").pop();
      const name = b.itemLabel?.value || qid;
      const desc = b.itemDescription?.value || "";
      const sitelinks = parseInt(b.sitelinks?.value || "10", 10);
      const imageUrl = b.image?.value;
      const gender = b.genderLabel?.value?.toLowerCase() === "male" ? "male" : "female";
      const birthYear = b.birthYear?.value ? parseInt(b.birthYear.value, 10) : undefined;
      const deathYear = b.deathYear?.value ? parseInt(b.deathYear.value, 10) : undefined;

      return {
        id: qid,
        name,
        description: desc,
        imageUrl,
        sitelinks,
        isFictional: desc.toLowerCase().includes("fictional") || desc.toLowerCase().includes("character"),
        gender,
        isAlive: birthYear && !deathYear && birthYear > 1920 ? true : deathYear ? false : undefined,
        birthYear,
        deathYear
      };
    });

    return items;
  } catch (err: any) {
    console.warn(`[Wikidata] SPARQL request failed or timed out: ${err.message}`);
    console.log("Using cached Wikidata entities dataset...");
    return getCuratedWikidataFallback();
  }
}

function getCuratedWikidataFallback(): WikidataItem[] {
  // Built-in offline curated entities
  return [
    { id: "Q937", name: "Albert Einstein", description: "German-born theoretical physicist", sitelinks: 320, isFictional: false, gender: "male", isAlive: false, birthYear: 1879, deathYear: 1955 },
    { id: "Q762", name: "Leonardo da Vinci", description: "Italian polymath of the Renaissance", sitelinks: 300, isFictional: false, gender: "male", isAlive: false, birthYear: 1452, deathYear: 1519 },
    { id: "Q11571", name: "Cristiano Ronaldo", description: "Portuguese footballer", sitelinks: 250, isFictional: false, gender: "male", isAlive: true, birthYear: 1985 },
    { id: "Q615", name: "Lionel Messi", description: "Argentine footballer", sitelinks: 245, isFictional: false, gender: "male", isAlive: true, birthYear: 1987 },
    { id: "Q26876", name: "Taylor Swift", description: "American singer-songwriter", sitelinks: 230, isFictional: false, gender: "female", isAlive: true, birthYear: 1989 },
    { id: "Q317521", name: "Elon Musk", description: "South African-American entrepreneur", sitelinks: 220, isFictional: false, gender: "male", isAlive: true, birthYear: 1971 },
    { id: "Q692", name: "William Shakespeare", description: "English playwright and poet", sitelinks: 290, isFictional: false, gender: "male", isAlive: false, birthYear: 1564, deathYear: 1616 },
    { id: "Q1001", name: "Mahatma Gandhi", description: "Indian political and spiritual leader", sitelinks: 260, isFictional: false, gender: "male", isAlive: false, birthYear: 1869, deathYear: 1948 },
    { id: "Q76", name: "Barack Obama", description: "44th President of the United States", sitelinks: 280, isFictional: false, gender: "male", isAlive: true, birthYear: 1961 },
    { id: "Q2831", name: "Michael Jackson", description: "American singer and dancer", sitelinks: 270, isFictional: false, gender: "male", isAlive: false, birthYear: 1958, deathYear: 2009 },
    { id: "Q7186", name: "Marie Curie", description: "Polish-French physicist and chemist", sitelinks: 240, isFictional: false, gender: "female", isAlive: false, birthYear: 1867, deathYear: 1934 },
    { id: "Q19837", name: "Steve Jobs", description: "Co-founder of Apple Inc.", sitelinks: 215, isFictional: false, gender: "male", isAlive: false, birthYear: 1955, deathYear: 2011 },
    { id: "Q9682", name: "Elizabeth II", description: "Queen of the United Kingdom (1952–2022)", sitelinks: 275, isFictional: false, gender: "female", isAlive: false, birthYear: 1926, deathYear: 2022 },
    { id: "Q255", name: "Ludwig van Beethoven", description: "German composer and pianist", sitelinks: 250, isFictional: false, gender: "male", isAlive: false, birthYear: 1770, deathYear: 1827 },
    { id: "Q4610", name: "Marilyn Monroe", description: "American actress, model, and singer", sitelinks: 235, isFictional: false, gender: "female", isAlive: false, birthYear: 1926, deathYear: 1962 },
    { id: "Q5582", name: "Vincent van Gogh", description: "Dutch post-impressionist painter", sitelinks: 245, isFictional: false, gender: "male", isAlive: false, birthYear: 1853, deathYear: 1890 },
    { id: "Q17714", name: "Harry Potter", description: "Fictional wizard created by J.K. Rowling", sitelinks: 210, isFictional: true, gender: "male", isAlive: true },
    { id: "Q4653", name: "Sherlock Holmes", description: "Fictional detective created by Arthur Conan Doyle", sitelinks: 220, isFictional: true, gender: "male", isAlive: false },
    { id: "Q2695", name: "Batman", description: "Fictional superhero appearing in DC Comics", sitelinks: 230, isFictional: true, gender: "male", isAlive: true },
    { id: "Q79015", name: "Superman", description: "Fictional superhero appearing in DC Comics", sitelinks: 225, isFictional: true, gender: "male", isAlive: true },
    { id: "Q79037", name: "Spider-Man", description: "Fictional superhero appearing in Marvel Comics", sitelinks: 240, isFictional: true, gender: "male", isAlive: true },
    { id: "Q12206942", name: "Darth Vader", description: "Fictional character in the Star Wars franchise", sitelinks: 215, isFictional: true, gender: "male", isAlive: false },
    { id: "Q12379", name: "Mario", description: "Fictional video game character created by Nintendo", sitelinks: 235, isFictional: true, gender: "male", isAlive: true },
    { id: "Q9357", name: "Pikachu", description: "Fictional Pokémon species and mascot", sitelinks: 230, isFictional: true, gender: "other", isAlive: true },
    { id: "Q11202", name: "Mickey Mouse", description: "Cartoon character created by Walt Disney", sitelinks: 250, isFictional: true, gender: "male", isAlive: true }
  ];
}

async function main() {
  console.log("🚀 Starting Wikidata Entity Import Pipeline...");
  const storage = await getStorage();

  const items = await fetchFromWikidataSPARQL(100);

  // Save cache
  const cachePath = path.resolve(process.cwd(), "data", "wikidata_cache.json");
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(items, null, 2), "utf8");
  console.log(`Saved ${items.length} entities to cache: ${cachePath}`);

  // Insert or update in storage
  let inserted = 0;
  for (const item of items) {
    const all = await storage.getAllEntities();
    const existing = all.find((e) => e.name.toLowerCase() === item.name.toLowerCase());

    if (!existing) {
      await storage.createEntity({
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl || null,
        popularity: Math.max(10, item.sitelinks * 100),
        status: "active"
      });
      inserted++;
    }
  }

  console.log(`✅ Wikidata import complete. ${inserted} new entities added to ${storage.name}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Wikidata import failed:", err);
  process.exit(1);
});
