import { getStorage } from "../server/db/storage.js";

interface PropertyRule {
  text: string;
  category: string;
  test: (entity: { name: string; description: string | null }) => boolean | null;
}

const PROPERTY_RULES: PropertyRule[] = [
  // 1. Biological & Demographic
  { text: "Is your character fictional?", category: "type", test: (e) => isFictional(e) },
  { text: "Is your character a real person?", category: "type", test: (e) => !isFictional(e) },
  { text: "Is your character male?", category: "gender", test: (e) => isMale(e) },
  { text: "Is your character female?", category: "gender", test: (e) => isFemale(e) },
  { text: "Is your character currently alive?", category: "status", test: (e) => isAlive(e) },
  { text: "Is your character deceased or historical?", category: "status", test: (e) => { const a = isAlive(e); return a === null ? null : !a; } },
  { text: "Is your character non-human (creature, animal, or alien)?", category: "species", test: (e) => isNonHuman(e) },
  { text: "Is your character a human being?", category: "species", test: (e) => { const nh = isNonHuman(e); return nh === null ? null : !nh; } },
  { text: "Is your character a child or teenager?", category: "age", test: (e) => isChild(e) },
  { text: "Is your character an elderly or aged figure?", category: "age", test: (e) => isElderly(e) },
  { text: "Is your character a monarch, royal, king, or queen?", category: "status", test: (e) => hasKeywords(e, ["king", "queen", "monarch", "emperor", "prince", "princess", "royal"]) },

  // 2. Occupations & Fields
  { text: "Is your character an actor or film star?", category: "occupation", test: (e) => hasKeywords(e, ["actor", "actress", "film", "starring"]) },
  { text: "Is your character a singer, vocalist, or pop star?", category: "occupation", test: (e) => hasKeywords(e, ["singer", "vocalist", "pop", "recording artist"]) },
  { text: "Is your character a musician or composer?", category: "occupation", test: (e) => hasKeywords(e, ["musician", "composer", "pianist", "guitarist", "band"]) },
  { text: "Is your character an athlete or sports figure?", category: "occupation", test: (e) => hasKeywords(e, ["football", "soccer", "tennis", "athlete", "nba", "olympic"]) },
  { text: "Is your character a professional football / soccer player?", category: "occupation", test: (e) => hasKeywords(e, ["footballer", "football", "soccer", "striker", "ballon d'or"]) },
  { text: "Is your character a tennis player?", category: "occupation", test: (e) => hasKeywords(e, ["tennis", "grand slam", "wimbledon"]) },
  { text: "Is your character a scientist, physicist, or mathematician?", category: "occupation", test: (e) => hasKeywords(e, ["scientist", "physicist", "mathematician", "chemist", "relativity", "nobel"]) },
  { text: "Is your character a tech entrepreneur or computer pioneer?", category: "occupation", test: (e) => hasKeywords(e, ["software", "microsoft", "apple", "tesla", "spacex", "computer", "tech"]) },
  { text: "Is your character a politician or head of state?", category: "occupation", test: (e) => hasKeywords(e, ["president", "prime minister", "politician", "independence", "politics"]) },
  { text: "Is your character an author, novelist, or playwright?", category: "occupation", test: (e) => hasKeywords(e, ["author", "novelist", "playwright", "poet", "writer"]) },
  { text: "Is your character a painter, artist, or sculptor?", category: "occupation", test: (e) => hasKeywords(e, ["painter", "artist", "sculptor", "painting", "mona lisa", "starry night"]) },
  { text: "Is your character a professional chef or television cook?", category: "occupation", test: (e) => hasKeywords(e, ["chef", "cook", "restaurant", "hell's kitchen"]) },
  { text: "Is your character an astronaut who went to space?", category: "occupation", test: (e) => hasKeywords(e, ["astronaut", "moon", "apollo", "space"]) },
  { text: "Is your character a detective, investigator, or spy?", category: "occupation", test: (e) => hasKeywords(e, ["detective", "spy", "secret service", "mi6", "investigator", "007", "sherlock"]) },

  // 3. Media & Franchises
  { text: "Is your character from a video game?", category: "media", test: (e) => hasKeywords(e, ["video game", "nintendo", "mario", "pokémon", "pokemon", "sega", "sonic"]) },
  { text: "Is your character an animated, cartoon, or anime character?", category: "media", test: (e) => hasKeywords(e, ["animated", "cartoon", "anime", "manga", "disney", "pixar"]) },
  { text: "Is your character from Marvel Comics or the MCU?", category: "media", test: (e) => hasKeywords(e, ["marvel", "avengers", "spider-man", "iron man", "stark"]) },
  { text: "Is your character from DC Comics?", category: "media", test: (e) => hasKeywords(e, ["dc comics", "batman", "superman", "joker", "gotham", "metropolis"]) },
  { text: "Is your character from the Star Wars universe?", category: "media", test: (e) => hasKeywords(e, ["star wars", "jedi", "sith", "vader", "skywalker", "yoda"]) },
  { text: "Is your character from the Harry Potter universe?", category: "media", test: (e) => hasKeywords(e, ["harry potter", "hogwarts", "wizardry", "voldemort", "granger", "hermione"]) },
  { text: "Is your character from Middle-earth or Lord of the Rings?", category: "media", test: (e) => hasKeywords(e, ["lord of the rings", "middle-earth", "gandalf", "hobbit", "frodo"]) },
  { text: "Is your character from Japanese anime or manga?", category: "media", test: (e) => hasKeywords(e, ["anime", "manga", "dragon ball", "naruto", "goku", "saiyan"]) },
  { text: "Is your character from a Disney animated feature?", category: "media", test: (e) => hasKeywords(e, ["disney", "frozen", "mickey", "elsa"]) },

  // 4. Powers, Equipment & Appearance
  { text: "Does your character possess magic or supernatural powers?", category: "powers", test: (e) => hasPowers(e) },
  { text: "Is your character a superhero?", category: "powers", test: (e) => hasKeywords(e, ["superhero", "avengers", "batman", "superman", "spider-man", "iron man"]) },
  { text: "Is your character a villain, criminal, or antagonist?", category: "powers", test: (e) => hasKeywords(e, ["villain", "antagonist", "joker", "voldemort", "dark lord", "sith"]) },
  { text: "Does your character wear a mask, helmet, or full disguise?", category: "appearance", test: (e) => hasKeywords(e, ["mask", "helmet", "batman", "spider-man", "vader", "iron man"]) },
  { text: "Does your character wear a cape or costume?", category: "appearance", test: (e) => hasKeywords(e, ["cape", "batman", "superman", "costume", "vader"]) },
  { text: "Is your character associated with high-tech powered armor?", category: "appearance", test: (e) => hasKeywords(e, ["armor", "armored", "iron man", "tony stark"]) },
  { text: "Does your character wield a wand?", category: "equipment", test: (e) => hasKeywords(e, ["wand", "harry potter", "hogwarts", "voldemort", "hermione"]) },
  { text: "Does your character fight with a lightsaber or sword?", category: "equipment", test: (e) => hasKeywords(e, ["lightsaber", "jedi", "sith", "vader", "skywalker", "gandalf", "sword"]) },
  { text: "Does your character have ice or freezing powers?", category: "powers", test: (e) => hasKeywords(e, ["ice", "snow", "cryokinetic", "frozen", "elsa"]) },
  { text: "Does your character have electrical or lightning powers?", category: "powers", test: (e) => hasKeywords(e, ["electric", "pikachu", "lightning"]) },
  { text: "Is your character famous for a yellow body or outfit?", category: "appearance", test: (e) => hasKeywords(e, ["yellow", "pikachu", "spongebob"]) },
  { text: "Is your character green in color?", category: "appearance", test: (e) => hasKeywords(e, ["green", "ogre", "shrek", "yoda"]) },

  // 5. Geography & Eras
  { text: "Is your character from or based in the United States?", category: "geography", test: (e) => hasKeywords(e, ["american", "united states", "usa", "us"]) },
  { text: "Is your character from Europe or the UK?", category: "geography", test: (e) => hasKeywords(e, ["english", "british", "german", "italian", "french", "portuguese", "polish", "dutch", "uk", "europe"]) },
  { text: "Is your character from Asia?", category: "geography", test: (e) => hasKeywords(e, ["indian", "japanese", "chinese", "asia", "gandhi", "manga", "anime"]) },
  { text: "Did your character live before the 20th century (before 1900)?", category: "era", test: (e) => isPre1900(e) },
  { text: "Has your character traveled into outer space or was born on another planet?", category: "geography", test: (e) => hasKeywords(e, ["astronaut", "space", "krypton", "superman", "tatooine", "star wars", "saiyan"]) },
  { text: "Does your character live underwater or in the sea?", category: "geography", test: (e) => hasKeywords(e, ["sea", "underwater", "spongebob", "bikini bottom", "pineapple"]) },

  // 6. Achievements & Wealth
  { text: "Has your character won a Nobel Prize?", category: "achievement", test: (e) => hasKeywords(e, ["nobel prize", "einstein", "curie", "obama"]) },
  { text: "Is your character a billionaire or billionaire industrialist?", category: "achievement", test: (e) => hasKeywords(e, ["billionaire", "musk", "gates", "bruce wayne", "tony stark"]) },
  { text: "Has your character won a FIFA World Cup?", category: "achievement", test: (e) => hasKeywords(e, ["messi", "world cup"]) }
];

function isFictional(e: { name: string; description: string | null }): boolean {
  const text = (e.name + " " + (e.description || "")).toLowerCase();
  return (
    text.includes("fictional") ||
    text.includes("character") ||
    text.includes("superhero") ||
    text.includes("wizard") ||
    text.includes("jedi") ||
    text.includes("pokémon") ||
    text.includes("pokemon") ||
    text.includes("video game") ||
    text.includes("ogre") ||
    text.includes("sponge") ||
    text.includes("comic")
  );
}

function isMale(e: { name: string; description: string | null }): boolean | null {
  const text = (e.name + " " + (e.description || "")).toLowerCase();
  if (text.includes("queen") || text.includes("actress") || text.includes("witch") || text.includes("princess") || text.includes("she") || text.includes("her") || text.includes("taylor swift") || text.includes("marilyn monroe") || text.includes("marie curie") || text.includes("serena williams") || text.includes("j.k. rowling") || text.includes("hermione") || text.includes("elsa")) {
    return false;
  }
  return true;
}

function isFemale(e: { name: string; description: string | null }): boolean | null {
  const m = isMale(e);
  return m === null ? null : !m;
}

function isAlive(e: { name: string; description: string | null }): boolean | null {
  const text = (e.name + " " + (e.description || "")).toLowerCase();
  if (text.includes("1955") || text.includes("1519") || text.includes("1616") || text.includes("1948") || text.includes("2009") || text.includes("1934") || text.includes("2011") || text.includes("2022") || text.includes("1827") || text.includes("1890") || text.includes("1862") || text.includes("1946") || text.includes("1977") || text.includes("einstein") || text.includes("shakespeare") || text.includes("gandhi") || text.includes("michael jackson") || text.includes("marie curie") || text.includes("steve jobs") || text.includes("elizabeth ii") || text.includes("beethoven") || text.includes("monroe") || text.includes("van gogh") || text.includes("hawking") || text.includes("armstrong") || text.includes("walt disney") || text.includes("mercury") || text.includes("vader") || text.includes("voldemort")) {
    return false;
  }
  return true;
}

function isNonHuman(e: { name: string; description: string | null }): boolean {
  const text = (e.name + " " + (e.description || "")).toLowerCase();
  return (
    text.includes("pokemon") ||
    text.includes("pokémon") ||
    text.includes("mouse") ||
    text.includes("hedgehog") ||
    text.includes("ogre") ||
    text.includes("sponge") ||
    text.includes("krypton") ||
    text.includes("alien") ||
    text.includes("robot") ||
    text.includes("yoda") ||
    text.includes("goku") ||
    text.includes("saiyan")
  );
}

function isChild(e: { name: string; description: string | null }): boolean {
  const text = (e.name + " " + (e.description || "")).toLowerCase();
  return text.includes("boy who lived") || text.includes("student") || text.includes("young") || text.includes("teenager");
}

function isElderly(e: { name: string; description: string | null }): boolean {
  const text = (e.name + " " + (e.description || "")).toLowerCase();
  return text.includes("900-year-old") || text.includes("longest-reigning") || text.includes("ancient") || text.includes("elderly") || text.includes("yoda") || text.includes("gandalf");
}

function isPre1900(e: { name: string; description: string | null }): boolean {
  const text = (e.name + " " + (e.description || "")).toLowerCase();
  return text.includes("renaissance") || text.includes("shakespeare") || text.includes("beethoven") || text.includes("van gogh") || text.includes("1452") || text.includes("1564") || text.includes("1770") || text.includes("1853");
}

function hasPowers(e: { name: string; description: string | null }): boolean {
  const text = (e.name + " " + (e.description || "")).toLowerCase();
  return (
    text.includes("wizard") ||
    text.includes("jedi") ||
    text.includes("sith") ||
    text.includes("magic") ||
    text.includes("superpower") ||
    text.includes("superhero") ||
    text.includes("spider-man") ||
    text.includes("superman") ||
    text.includes("electric") ||
    text.includes("ice") ||
    text.includes("frozen") ||
    text.includes("saiyan") ||
    text.includes("ninja") ||
    text.includes("witch")
  );
}

function hasKeywords(e: { name: string; description: string | null }, keywords: string[]): boolean {
  const text = (e.name + " " + (e.description || "")).toLowerCase();
  return keywords.some((k) => text.includes(k.toLowerCase()));
}

async function main() {
  console.log("⚙️ Starting Question Generator Pipeline...");
  const storage = await getStorage();

  const allQuestions = await storage.getAllQuestions();
  const existingTexts = new Set(allQuestions.map((q) => q.text.toLowerCase().trim()));

  let createdQuestions = 0;
  const questionMap: Map<string, number> = new Map();

  for (const q of allQuestions) {
    questionMap.set(q.text.toLowerCase().trim(), q.id);
  }

  // Create missing questions from rule definitions
  for (const rule of PROPERTY_RULES) {
    const key = rule.text.toLowerCase().trim();
    if (!existingTexts.has(key)) {
      const q = await storage.createQuestion({
        text: rule.text,
        source: "wikidata",
        qualityScore: 1.0,
        timesAsked: 0,
        isActive: true
      });
      questionMap.set(key, q.id);
      existingTexts.add(key);
      createdQuestions++;
    }
  }

  console.log(`Created ${createdQuestions} new structured questions.`);

  // Auto-fill answers deterministically for all entities
  const entities = await storage.getActiveEntities();
  console.log(`Setting deterministic answers (yes_w=10 / no_w=10) across ${entities.length} entities...`);

  let pairsUpdated = 0;
  for (const ent of entities) {
    for (const rule of PROPERTY_RULES) {
      const qId = questionMap.get(rule.text.toLowerCase().trim());
      if (!qId) continue;

      const evalResult = rule.test(ent);
      if (evalResult !== null) {
        await storage.setEntityAnswer(ent.id, qId, {
          yesW: evalResult ? 10.0 : 0.0,
          noW: evalResult ? 0.0 : 10.0,
          unknownW: 0.0
        });
        pairsUpdated++;
      }
    }
  }

  console.log(`✅ Question generator complete. ${pairsUpdated} deterministic answer pairs recorded.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Question generator error:", err);
  process.exit(1);
});
