import * as fs from "fs";
import { NEW_ENTITIES, NEW_QUESTIONS } from "./new_items_data.js";
import { groundTruthToWeights } from "./data/seed_small_data.js";
import { InMemoryStorage } from "../server/db/storage.js";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine, ANSWER_VALUES } from "../server/engine/bayes.js";
import { GameSessionManager } from "../server/engine/session.js";

// Specific ground truth overrides for new & modified entities (object domain)
const NEW_ENTITY_GROUND_TRUTH: Record<number, Record<number, number>> = {
  // 96: Cricket Ball
  96: {
    41: 0, 42: 1, 43: 0, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0,
    51: 0, 52: 0, 53: 1, 54: 0, 55: 0, 56: 0, 57: 0.1, 58: 0, 59: 0, 60: 0,
    61: 0, 62: 0.1, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0,
    106: 0, 107: 0, 108: 0, 109: 0, 110: 0, 111: 0, 112: 0, 113: 0.2, 114: 0, 115: 0,
    116: 0, 117: 1, 118: 0, 119: 0, 120: 0, 121: 0, 122: 0.8, 123: 0, 124: 0, 125: 0,
    126: 0, 127: 0, 128: 0, 129: 0, 130: 0, 131: 0, 132: 0, 133: 0, 134: 0, 135: 0,
    136: 0, 137: 0.2, 138: 0, 139: 0, 140: 0, 141: 0, 142: 1, 143: 0, 144: 0.75, 145: 1,
    146: 0.4, 147: 0, 148: 0, 149: 0, 150: 1, 151: 1, 152: 0, 153: 0, 154: 0, 155: 0,
    156: 0, 157: 0.3, 158: 0, 159: 0, 160: 0, 161: 1, 162: 1, 163: 0, 164: 0.85, 165: 1,
    166: 1, 167: 0, 168: 0, 169: 0, 170: 0, 171: 0, 172: 0, 173: 0, 174: 0, 175: 0,
    176: 0, 177: 0, 178: 0, 179: 0, 180: 0
  },
  // 97: Football (Soccer Ball)
  97: {
    41: 0, 42: 0.6, 43: 0, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0,
    51: 0, 52: 0, 53: 1, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0,
    61: 0, 62: 0.2, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0,
    106: 0, 107: 0, 108: 0, 109: 0, 110: 0, 111: 0, 112: 0, 113: 0, 114: 0.85, 115: 0,
    116: 0, 117: 1, 118: 0, 119: 0, 120: 0, 121: 0, 122: 0.7, 123: 0, 124: 0, 125: 0,
    126: 0, 127: 0, 128: 0, 129: 0, 130: 0, 131: 0, 132: 0, 133: 0, 134: 0, 135: 0,
    136: 0, 137: 0.2, 138: 0, 139: 0, 140: 0, 141: 0, 142: 1, 143: 0, 144: 0.8, 145: 0.4,
    146: 0.75, 147: 0.9, 148: 0, 149: 0, 150: 0.75, 151: 0.75, 152: 0, 153: 0.3, 154: 0, 155: 0,
    156: 0, 157: 0.3, 158: 0, 159: 0, 160: 0, 161: 0, 162: 0, 163: 1, 164: 0.95, 165: 1,
    166: 1, 167: 0, 168: 0, 169: 0, 170: 0, 171: 0, 172: 0, 173: 0, 174: 0, 175: 0,
    176: 0, 177: 0, 178: 0, 179: 1, 180: 0
  },
  // 98: Tennis Ball
  98: {
    41: 0, 42: 1, 43: 0, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0,
    51: 0.2, 52: 0, 53: 1, 54: 0, 55: 0, 56: 0, 57: 0.2, 58: 0, 59: 0, 60: 0,
    61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0.3, 68: 0, 69: 0, 70: 0,
    106: 0, 107: 0, 108: 0, 109: 0, 110: 0, 111: 0, 112: 0, 113: 0, 114: 1, 115: 0,
    116: 0, 117: 1, 118: 0, 119: 0, 120: 0, 121: 0, 122: 1, 123: 0, 124: 0, 125: 0,
    126: 0, 127: 0, 128: 0, 129: 0, 130: 0, 131: 0, 132: 0, 133: 0, 134: 0, 135: 0,
    136: 0, 137: 0, 138: 0, 139: 0, 140: 0, 141: 0, 142: 1, 143: 0, 144: 0.85, 145: 1,
    146: 1, 147: 1, 148: 0, 149: 1, 150: 0, 151: 0.7, 152: 0.3, 153: 0.7, 154: 0, 155: 0,
    156: 0, 157: 0.3, 158: 0, 159: 0, 160: 0, 161: 0, 162: 1, 163: 0, 164: 1, 165: 1,
    166: 1, 167: 0, 168: 0, 169: 0, 170: 0, 171: 0, 172: 0, 173: 1, 174: 0, 175: 0,
    176: 0, 177: 0, 178: 0, 179: 0, 180: 0
  },
  // 99: Volleyball
  99: {
    41: 0, 42: 0.6, 43: 0, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0,
    51: 0, 52: 0, 53: 1, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0,
    61: 0, 62: 0.1, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0.2, 68: 0, 69: 0, 70: 0,
    106: 0, 107: 0, 108: 0, 109: 0, 110: 0, 111: 0, 112: 0, 113: 0, 114: 0.85, 115: 0,
    116: 0, 117: 1, 118: 0, 119: 0, 120: 0, 121: 0, 122: 0.75, 123: 0, 124: 0, 125: 0,
    126: 0, 127: 0, 128: 0, 129: 0, 130: 0, 131: 0, 132: 0, 133: 0, 134: 0, 135: 0,
    136: 0, 137: 0.2, 138: 0, 139: 0, 140: 0, 141: 0, 142: 1, 143: 0, 144: 0.75, 145: 0.5,
    146: 0.75, 147: 0.9, 148: 0, 149: 0, 150: 0.8, 151: 0.5, 152: 0.3, 153: 0.4, 154: 0, 155: 0,
    156: 0, 157: 0.3, 158: 0, 159: 0, 160: 0, 161: 0, 162: 0, 163: 0, 164: 0.9, 165: 1,
    166: 1, 167: 0, 168: 0, 169: 0, 170: 0, 171: 0, 172: 0, 173: 0, 174: 1, 175: 0,
    176: 0, 177: 0, 178: 0, 179: 0, 180: 0
  },
  // 100: Ballpoint Pen
  100: {
    41: 0, 42: 1, 43: 0, 44: 0.5, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0,
    51: 0, 52: 0, 53: 0, 54: 0, 55: 0.3, 56: 0, 57: 0, 58: 0, 59: 1, 60: 0,
    61: 0, 62: 0, 63: 0, 64: 0.7, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0,
    106: 0, 107: 0, 108: 0, 109: 0, 110: 0, 111: 0, 112: 0, 113: 0, 114: 1, 115: 0,
    116: 0, 117: 0, 118: 0, 119: 0, 120: 0, 121: 0, 122: 1, 123: 0, 124: 0, 125: 0,
    126: 0, 127: 0, 128: 0, 129: 0, 130: 0, 131: 0, 132: 1, 133: 0, 134: 0, 135: 0,
    136: 0, 137: 0, 138: 0, 139: 1, 140: 0, 141: 0, 142: 1, 143: 0, 144: 1, 145: 1,
    146: 1, 147: 1, 148: 0, 149: 0, 150: 0, 151: 1, 152: 0, 153: 0, 154: 0, 155: 0,
    156: 0, 157: 1, 158: 0, 159: 0, 160: 0, 161: 0, 162: 0, 163: 0, 164: 0, 165: 0,
    166: 0, 167: 1, 168: 0, 169: 0.8, 170: 0.8, 171: 1, 172: 0, 173: 0, 174: 0, 175: 0,
    176: 0, 177: 0, 178: 0, 179: 0, 180: 0
  },
  // 101: Apple
  101: {
    41: 0, 42: 1, 43: 1, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0,
    51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0.2, 58: 0, 59: 0, 60: 0,
    61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0, 68: 0, 69: 0, 70: 0,
    106: 0, 107: 0, 108: 0, 109: 0, 110: 0, 111: 0, 112: 0, 113: 0, 114: 0, 115: 0.75,
    116: 0, 117: 0, 118: 0, 119: 0, 120: 0, 121: 0, 122: 1, 123: 0, 124: 0, 125: 0,
    126: 0, 127: 0, 128: 0, 129: 0, 130: 0, 131: 0, 132: 0, 133: 0, 134: 0, 135: 0,
    136: 0, 137: 0, 138: 0, 139: 0.3, 140: 0, 141: 1, 142: 0, 143: 0, 144: 1, 145: 1,
    146: 1, 147: 0, 148: 0, 149: 0, 150: 0, 151: 0.8, 152: 0, 153: 0, 154: 0, 155: 1,
    156: 0, 157: 0.5, 158: 0, 159: 0.75, 160: 0, 161: 0, 162: 0, 163: 0, 164: 0, 165: 0,
    166: 1, 167: 0, 168: 0, 169: 0, 170: 0, 171: 0, 172: 0, 173: 0, 174: 0, 175: 0,
    176: 1, 177: 0, 178: 0, 179: 0, 180: 0
  },
  // 102: Tomato
  102: {
    41: 0, 42: 1, 43: 1, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0,
    51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0.2, 58: 0, 59: 0, 60: 0,
    61: 0, 62: 0, 63: 0, 64: 0, 65: 0, 66: 0, 67: 0.3, 68: 0, 69: 0, 70: 0,
    106: 0, 107: 0, 108: 0, 109: 0, 110: 0, 111: 0, 112: 0, 113: 0, 114: 0, 115: 1,
    116: 0, 117: 0, 118: 0, 119: 0, 120: 0, 121: 0, 122: 1, 123: 0, 124: 0, 125: 0,
    126: 0, 127: 0, 128: 0, 129: 0, 130: 0, 131: 0, 132: 0, 133: 0, 134: 0, 135: 0,
    136: 0, 137: 0, 138: 0, 139: 0, 140: 0, 141: 1, 142: 0, 143: 0, 144: 1, 145: 1,
    146: 1, 147: 0, 148: 0, 149: 0, 150: 0, 151: 0.2, 152: 0.7, 153: 0.4, 154: 0, 155: 1,
    156: 0, 157: 0.2, 158: 0, 159: 1, 160: 0, 161: 0, 162: 0, 163: 0, 164: 0, 165: 0,
    166: 1, 167: 0, 168: 0, 169: 0, 170: 0, 171: 0, 172: 0, 173: 0, 174: 0, 175: 1,
    176: 0, 177: 0, 178: 0, 179: 0, 180: 0
  },
  // 103: Computer Mouse
  103: {
    41: 1, 42: 1, 43: 0, 44: 0, 45: 0, 46: 0, 47: 0, 48: 0, 49: 0, 50: 0,
    51: 0, 52: 0, 53: 0, 54: 0, 55: 0, 56: 0, 57: 0, 58: 0.7, 59: 0.2, 60: 0,
    61: 0.3, 62: 0.1, 63: 0, 64: 1, 65: 0, 66: 0.8, 67: 0, 68: 0, 69: 0, 70: 0,
    106: 0.6, 107: 0.5, 108: 0, 109: 0, 110: 0, 111: 0, 112: 0.8, 113: 0, 114: 1, 115: 0,
    116: 0, 117: 0, 118: 0, 119: 0, 120: 0, 121: 0, 122: 0.85, 123: 0, 124: 0.3, 125: 0,
    126: 0, 127: 0, 128: 0, 129: 0, 130: 0, 131: 0, 132: 0, 133: 0, 134: 0, 135: 0,
    136: 0, 137: 0, 138: 0, 139: 1, 140: 0, 141: 0, 142: 1, 143: 0, 144: 1, 145: 1,
    146: 0.7, 147: 1, 148: 0, 149: 0, 150: 0, 151: 1, 152: 0, 153: 0, 154: 0, 155: 0,
    156: 0, 157: 1, 158: 0, 159: 0, 160: 0.3, 161: 0, 162: 0, 163: 0, 164: 0, 165: 0,
    166: 0.3, 167: 0, 168: 0, 169: 0, 170: 0.8, 171: 0, 172: 0, 173: 0, 174: 0, 175: 0,
    176: 0, 177: 1, 178: 0, 179: 0, 180: 0
  }
};

// Ground truth for existing entities on the new questions (171 to 180)
const EXISTING_ENTITIES_NEW_Q: Record<number, Record<number, number>> = {
  // 74: Wooden Pencil
  74: { 171: 0, 172: 1, 173: 0, 174: 0, 175: 0, 176: 0, 177: 0, 178: 0, 179: 0, 180: 0 },
  // 90: Basketball
  90: { 171: 0, 172: 0, 173: 0, 174: 0, 175: 0, 176: 0, 177: 0, 178: 1, 179: 0, 180: 1 }
};

export async function applyDatabaseUpdates() {
  const dbPath = "data/local_db.json";
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

  // 1. Update Q141 text
  const q141 = db.questions.find((q: any) => q.id === 141);
  if (q141) {
    q141.text = "Is it grown naturally from the ground or a tree?";
  }

  // 2. Add new questions 171-178
  const qIds = new Set(db.questions.map((q: any) => q.id));
  for (const q of NEW_QUESTIONS) {
    if (!qIds.has(q.id)) {
      db.questions.push(q);
      qIds.add(q.id);
    }
  }

  // 3. Add new entities 96-103
  const entIds = new Set(db.entities.map((e: any) => e.id));
  for (const ent of NEW_ENTITIES) {
    if (!entIds.has(ent.id)) {
      db.entities.push({
        ...ent,
        createdAt: new Date().toISOString()
      });
      entIds.add(ent.id);
    }
  }

  // 4. Update entityAnswers
  const ansMap = new Map<string, any>();
  for (const a of db.entityAnswers) {
    ansMap.set(`${a.entityId}:${a.questionId}`, a);
  }

  function setAnswer(entityId: number, questionId: number, val: number) {
    const key = `${entityId}:${questionId}`;
    const w = groundTruthToWeights(val);
    if (ansMap.has(key)) {
      const a = ansMap.get(key);
      a.yesW = w.yesW;
      a.noW = w.noW;
      a.unknownW = w.unknownW;
    } else {
      const entry = {
        entityId,
        questionId,
        yesW: w.yesW,
        noW: w.noW,
        unknownW: w.unknownW
      };
      db.entityAnswers.push(entry);
      ansMap.set(key, entry);
    }
  }

  // Apply new entities answers
  for (const [eIdStr, qMap] of Object.entries(NEW_ENTITY_GROUND_TRUTH)) {
    const eId = Number(eIdStr);
    for (const [qIdStr, val] of Object.entries(qMap)) {
      setAnswer(eId, Number(qIdStr), val);
    }
  }

  // Apply existing entities answers for Q171-Q180 (default 0.0 for all object entities)
  const allObjects = db.entities.filter((e: any) => e.category === "object");
  for (const obj of allObjects) {
    for (let qId = 171; qId <= 180; qId++) {
      const overrideVal = (EXISTING_ENTITIES_NEW_Q[obj.id] || {})[qId];
      const val = overrideVal !== undefined ? overrideVal : (NEW_ENTITY_GROUND_TRUTH[obj.id] || {})[qId] || 0.0;
      setAnswer(obj.id, qId, val);
    }
  }

  // Set Q141 for all existing objects (0.0 except wood/pencil which is 0.4, apple/tomato which is 1.0)
  for (const obj of allObjects) {
    if (obj.id === 101 || obj.id === 102) {
      setAnswer(obj.id, 141, 1.0);
    } else if (obj.id === 74 || obj.id === 57 || obj.id === 89) {
      setAnswer(obj.id, 141, 0.4); // Wood
    } else {
      setAnswer(obj.id, 141, 0.0);
    }
  }

  db.entityIdCounter = 104;
  db.questionIdCounter = 181;

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  console.log("Database successfully upgraded and synchronized!");
}

async function runValidationAndTests() {
  await applyDatabaseUpdates();

  const storage = new InMemoryStorage("data/local_db.json");
  await storage.init();
  const matrix = new EngineMatrix();
  await matrix.load(storage);
  const engine = new BayesianEngine(matrix);

  console.log("\n=======================================================");
  console.log("PART A: VALIDATION REPORT");
  console.log("=======================================================");

  // 1. Missing values
  let missingCount = 0;
  for (let i = 0; i < matrix.numEntities; i++) {
    const e = matrix.entities[i];
    for (let j = 0; j < matrix.numQuestions; j++) {
      const q = matrix.questions[j];
      if (q.category !== e.category && q.category !== "common") continue;
      const conf = matrix.getConfidence(i, j);
      if (conf === 0) {
        missingCount++;
      }
    }
  }
  console.log(`- Missing values check: ${missingCount === 0 ? "PASSED (0 missing cells)" : `FAILED (${missingCount} missing)`}`);

  // 2. Pairs differing in fewer than 3 questions
  const objects = matrix.objectEntityIndices;
  const objQuestions = matrix.questions
    .map((q, idx) => ({ ...q, idx }))
    .filter(q => q.category === "object" || q.category === "common");

  console.log(`- Total objects in pool: ${objects.length}`);
  console.log(`- Total object/common questions: ${objQuestions.length}`);

  let closePairsCount = 0;
  const closePairsList: string[] = [];

  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const idx1 = objects[i];
      const idx2 = objects[j];
      let diffQuestions = 0;

      for (const q of objQuestions) {
        const v1 = matrix.getPYes(idx1, q.idx);
        const v2 = matrix.getPYes(idx2, q.idx);
        if (Math.abs(v1 - v2) >= 0.40) {
          diffQuestions++;
        }
      }

      if (diffQuestions < 3) {
        closePairsCount++;
        closePairsList.push(`${matrix.entities[idx1].name} vs ${matrix.entities[idx2].name} (${diffQuestions} diffs)`);
      }
    }
  }

  console.log(`- Pairs differing in fewer than 3 questions: ${closePairsCount}`);
  if (closePairsList.length > 0) {
    console.log("  Pairs with < 3 differences:", closePairsList);
  } else {
    console.log("  PASSED: Every single pair of items differs in 3 or more questions!");
  }

  // 3. Questions answered the same way by all items
  let uniformQCount = 0;
  for (const q of objQuestions) {
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const idx of objects) {
      const val = matrix.getPYes(idx, q.idx);
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }
    if (maxVal - minVal < 0.08) {
      uniformQCount++;
      console.log(`  [Uniform Question] Q${q.id}: "${q.text}" (All values ~${minVal.toFixed(2)})`);
    }
  }
  console.log(`- Questions with uniform answers across all objects: ${uniformQCount}`);
  if (uniformQCount === 0) {
    console.log("  PASSED: Every question in the pool discriminates effectively!");
  }

  console.log("\n=======================================================");
  console.log("PART B: PERFECT-PLAYER SIMULATION TEST (ALL OBJECTS)");
  console.log("=======================================================");

  let perfectWins = 0;
  let perfectQuestionsTotal = 0;
  const perfectFails: string[] = [];
  const mustPassNames = [
    "Cricket Ball", "Basketball", "Football (Soccer Ball)", "Tennis Ball",
    "Volleyball", "Ballpoint Pen", "Wooden Pencil", "Apple", "Tomato"
  ];
  const mustPassResults: Record<string, { perfect: boolean; noisy: boolean; perfectSteps?: number; noisySteps?: number }> = {};
  for (const name of mustPassNames) {
    mustPassResults[name] = { perfect: false, noisy: false };
  }

  for (const objIdx of objects) {
    const target = matrix.entities[objIdx];
    const session = new GameSessionManager(`perfect-${target.id}`, matrix, engine, "object");
    let curQ = session.start().question;

    while (session.state === "in_progress" || session.state === "guess_pending") {
      if (session.state === "guess_pending") {
        const guess = session.pendingGuess!;
        const isCorrect = guess.entityId === target.id;
        const res = session.confirmGuess(isCorrect);
        if (isCorrect) {
          perfectWins++;
          perfectQuestionsTotal += session.stepCount;
          if (mustPassResults[target.name]) {
            mustPassResults[target.name].perfect = true;
            mustPassResults[target.name].perfectSteps = session.stepCount;
          }
          break;
        }
        if (res.state === "lost" || session.guessesCount >= 3) {
          perfectFails.push(`${target.name} (ID: ${target.id}) - guessed ${guess.name} instead`);
          break;
        }
        if (res.question) curQ = res.question;
        continue;
      }

      const qIdx = matrix.questionIdToIndex.get(curQ.id)!;
      const trueVal = matrix.getPYes(objIdx, qIdx);
      let ans: number = ANSWER_VALUES.UNKNOWN;
      if (trueVal >= 0.85) ans = ANSWER_VALUES.YES;
      else if (trueVal <= 0.15) ans = ANSWER_VALUES.NO;
      else if (trueVal >= 0.65) ans = ANSWER_VALUES.PROBABLY;
      else if (trueVal <= 0.35) ans = ANSWER_VALUES.PROBABLY_NOT;

      const res = session.answer(ans);
      if (res.state === "guess_pending") continue;
      if (res.state === "lost") {
        perfectFails.push(`${target.name} (ID: ${target.id}) - state lost at step ${session.stepCount}`);
        break;
      }
      if (res.question) curQ = res.question;
    }
  }

  const perfectAccuracy = (perfectWins / objects.length) * 100;
  const avgPerfectQuestions = perfectQuestionsTotal / Math.max(1, perfectWins);

  console.log(`- Overall Accuracy: ${perfectAccuracy.toFixed(1)}% (${perfectWins}/${objects.length})`);
  console.log(`- Average Number of Questions: ${avgPerfectQuestions.toFixed(1)}`);
  console.log(`- Failed Items: ${perfectFails.length === 0 ? "None (100% success)" : perfectFails.join("; ")}`);

  console.log("\n=======================================================");
  console.log("PART C: NOISY-PLAYER TEST (10% NOISE ON ALL OBJECTS)");
  console.log("=======================================================");

  let noisyWins = 0;
  let noisyQuestionsTotal = 0;
  const noisyFails: string[] = [];

  for (const objIdx of objects) {
    const target = matrix.entities[objIdx];
    const session = new GameSessionManager(`noisy-${target.id}`, matrix, engine, "object");
    let curQ = session.start().question;

    while (session.state === "in_progress" || session.state === "guess_pending") {
      if (session.state === "guess_pending") {
        const guess = session.pendingGuess!;
        const isCorrect = guess.entityId === target.id;
        const res = session.confirmGuess(isCorrect);
        if (isCorrect) {
          noisyWins++;
          noisyQuestionsTotal += session.stepCount;
          if (mustPassResults[target.name]) {
            mustPassResults[target.name].noisy = true;
            mustPassResults[target.name].noisySteps = session.stepCount;
          }
          break;
        }
        if (res.state === "lost" || session.guessesCount >= 3) {
          noisyFails.push(`${target.name} (ID: ${target.id}) - guessed ${guess.name} instead`);
          break;
        }
        if (res.question) curQ = res.question;
        continue;
      }

      const qIdx = matrix.questionIdToIndex.get(curQ.id)!;
      const trueVal = matrix.getPYes(objIdx, qIdx);

      // Determine true option
      let ans: number = ANSWER_VALUES.UNKNOWN;
      if (trueVal >= 0.85) ans = ANSWER_VALUES.YES;
      else if (trueVal <= 0.15) ans = ANSWER_VALUES.NO;
      else if (trueVal >= 0.65) ans = ANSWER_VALUES.PROBABLY;
      else if (trueVal <= 0.35) ans = ANSWER_VALUES.PROBABLY_NOT;

      // 10% chance to shift to neighbouring option
      if (Math.random() < 0.10) {
        if (ans === ANSWER_VALUES.YES) ans = ANSWER_VALUES.PROBABLY;
        else if (ans === ANSWER_VALUES.NO) ans = ANSWER_VALUES.PROBABLY_NOT;
        else if (ans === ANSWER_VALUES.PROBABLY) ans = Math.random() < 0.5 ? ANSWER_VALUES.YES : ANSWER_VALUES.UNKNOWN;
        else if (ans === ANSWER_VALUES.PROBABLY_NOT) ans = Math.random() < 0.5 ? ANSWER_VALUES.NO : ANSWER_VALUES.UNKNOWN;
      }

      const res = session.answer(ans);
      if (res.state === "guess_pending") continue;
      if (res.state === "lost") {
        noisyFails.push(`${target.name} (ID: ${target.id}) - state lost at step ${session.stepCount}`);
        break;
      }
      if (res.question) curQ = res.question;
    }
  }

  const noisyAccuracy = (noisyWins / objects.length) * 100;
  const avgNoisyQuestions = noisyQuestionsTotal / Math.max(1, noisyWins);

  console.log(`- Overall Accuracy: ${noisyAccuracy.toFixed(1)}% (${noisyWins}/${objects.length})`);
  console.log(`- Average Number of Questions: ${avgNoisyQuestions.toFixed(1)}`);
  console.log(`- Failed Items: ${noisyFails.length === 0 ? "None (100% success)" : noisyFails.join("; ")}`);

  console.log("\n=======================================================");
  console.log("PART D: MUST-PASS ITEMS AUDIT");
  console.log("=======================================================");

  let allMustPassPassed = true;
  for (const [name, res] of Object.entries(mustPassResults)) {
    const passedBoth = res.perfect && res.noisy;
    if (!passedBoth) allMustPassPassed = false;
    console.log(`- ${name.padEnd(25)}: Perfect: ${res.perfect ? `PASS (${res.perfectSteps} Qs)` : "FAIL"} | Noisy: ${res.noisy ? `PASS (${res.noisySteps} Qs)` : "FAIL"}`);
  }

  console.log("\n=======================================================");
  console.log("PART E: FIX LOOP TARGET CHECK");
  console.log("=======================================================");
  console.log(`- Perfect Player Target: >= 95% -> Achieved: ${perfectAccuracy.toFixed(1)}% [${perfectAccuracy >= 95 ? "TARGET MET" : "FAIL"}]`);
  console.log(`- Noisy Player Target:   >= 85% -> Achieved: ${noisyAccuracy.toFixed(1)}% [${noisyAccuracy >= 85 ? "TARGET MET" : "FAIL"}]`);
  console.log(`- Must-Pass Items:       9 / 9  -> [${allMustPassPassed ? "ALL 9 PASSED" : "FAILED"}]`);
}

runValidationAndTests().catch(console.error);
