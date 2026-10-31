import { performance } from "perf_hooks";
import { EngineMatrix } from "../server/engine/matrix.js";
import { BayesianEngine, ANSWER_VALUES } from "../server/engine/bayes.js";

async function runBenchmark(numEntities = 10000, numQuestions = 500, numSteps = 25) {
  console.log("=================================================================");
  console.log("⚡ COGNITOR HIGH-SCALE IN-MEMORY ENGINE BENCHMARK");
  console.log(`Dimensions: ${numEntities.toLocaleString()} Entities x ${numQuestions.toLocaleString()} Questions (${(numEntities * numQuestions).toLocaleString()} cells)`);
  console.log(`Steps to benchmark: ${numSteps} steps | Target: < 150 ms per step`);
  console.log("=================================================================\n");

  console.log("Allocating and initializing Float32Arrays...");
  const initStart = performance.now();

  const matrix = new EngineMatrix();
  matrix.numEntities = numEntities;
  matrix.numQuestions = numQuestions;

  matrix.entities = new Array(numEntities);
  matrix.characterEntityIndices = [];
  matrix.objectEntityIndices = [];

  for (let i = 0; i < numEntities; i++) {
    matrix.entities[i] = {
      id: i + 1,
      name: `Entity ${i + 1}`,
      description: `Benchmark synthetic entity ${i + 1}`,
      imageUrl: null,
      popularity: Math.floor(Math.random() * 50000) + 10,
      category: "character"
    };
    matrix.entityIdToIndex.set(i + 1, i);
    matrix.characterEntityIndices.push(i);
  }

  matrix.questions = new Array(numQuestions);
  for (let j = 0; j < numQuestions; j++) {
    matrix.questions[j] = {
      id: j + 1,
      text: `Is your character associated with synthetic feature ${j + 1}?`,
      source: "wikidata",
      category: "character",
      qualityScore: 1.0,
      timesAsked: 0,
      isActive: true
    };
    matrix.questionIdToIndex.set(j + 1, j);
  }

  const totalCells = numEntities * numQuestions;
  matrix.pYes = new Float32Array(totalCells);
  matrix.confidence = new Float32Array(totalCells);

  // Populate synthetic distribution (p_yes ~ 0.1 to 0.9, conf ~ 5 to 25)
  for (let k = 0; k < totalCells; k++) {
    matrix.pYes[k] = 0.1 + Math.random() * 0.8;
    matrix.confidence[k] = 5.0 + Math.random() * 20.0;
  }

  // Priors
  matrix.priors = new Float32Array(numEntities);
  let priorSum = 0;
  for (let i = 0; i < numEntities; i++) {
    const val = Math.log(1.0 + matrix.entities[i].popularity);
    matrix.priors[i] = val;
    priorSum += val;
  }
  for (let i = 0; i < numEntities; i++) {
    matrix.priors[i] /= priorSum;
  }

  const initTime = performance.now() - initStart;
  console.log(`Memory matrix initialized in ${initTime.toFixed(1)} ms. (~${((totalCells * 8) / (1024 * 1024)).toFixed(1)} MB)\n`);

  const engine = new BayesianEngine(matrix);
  let posterior = engine.createInitialPosterior();
  const asked = new Set<number>();

  const stepTimes: number[] = [];

  console.log("Warming up V8 JIT compiler...");
  const warmupRec = engine.selectNextQuestion(posterior, asked, 0);
  if (warmupRec) {
    engine.updatePosterior(posterior, warmupRec.questionIdx, ANSWER_VALUES.YES);
    engine.getTopCandidates(posterior, 5);
  }
  // Reset for benchmark
  posterior = engine.createInitialPosterior();
  asked.clear();

  console.log("Running simulated game steps...");

  for (let step = 0; step < numSteps; step++) {
    const stepStart = performance.now();

    // 1. Question selection (Expected Info Gain across top-300 candidates)
    const rec = engine.selectNextQuestion(posterior, asked, step);
    if (!rec) {
      console.warn("No question found at step", step);
      break;
    }
    asked.add(rec.questionIdx);

    // 2. Simulated answer (e.g. YES or NO)
    const simulatedAnswer = step % 2 === 0 ? ANSWER_VALUES.YES : ANSWER_VALUES.NO;

    // 3. Bayesian update over all 10,000 entities
    posterior = engine.updatePosterior(posterior, rec.questionIdx, simulatedAnswer);

    // 4. Top candidates ranking
    const topCandidates = engine.getTopCandidates(posterior, 5);

    const stepElapsed = performance.now() - stepStart;
    stepTimes.push(stepElapsed);

    if (step < 5 || step === numSteps - 1) {
      console.log(
        `Step ${step + 1}: ${stepElapsed.toFixed(2)} ms | Selected Q#${rec.questionId} (IG: ${rec.expectedInfoGain.toFixed(4)}) | Top P: ${(topCandidates[0].probability * 100).toFixed(1)}%`
      );
    } else if (step === 5) {
      console.log("...");
    }
  }

  const totalTime = stepTimes.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / stepTimes.length;
  const minTime = Math.min(...stepTimes);
  const maxTime = Math.max(...stepTimes);

  const sortedTimes = [...stepTimes].sort((a, b) => a - b);
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];

  console.log("\n┌─────────────────────────────────────────────────────────────┐");
  console.log("│                    BENCHMARK RESULTS                        │");
  console.log("├───────────────────────────────┬─────────────────────────────┤");
  console.log(`│ Entity Count                  │ ${numEntities.toLocaleString().padEnd(27)} │`);
  console.log(`│ Question Count                │ ${numQuestions.toLocaleString().padEnd(27)} │`);
  console.log(`│ Total Steps Measured          │ ${stepTimes.length.toString().padEnd(27)} │`);
  console.log(`│ Average Step Latency          │ ${(avgTime.toFixed(2) + " ms").padEnd(27)} │`);
  console.log(`│ 95th Percentile (p95)         │ ${(p95.toFixed(2) + " ms").padEnd(27)} │`);
  console.log(`│ Fastest Step                  │ ${(minTime.toFixed(2) + " ms").padEnd(27)} │`);
  console.log(`│ Slowest Step                  │ ${(maxTime.toFixed(2) + " ms").padEnd(27)} │`);
  console.log(`│ Spec SLA Target               │ < 150.00 ms                 │`);
  console.log("└───────────────────────────────┴─────────────────────────────┘\n");

  if (avgTime < 150.0) {
    console.log(`🚀 SLA MET: Average latency of ${avgTime.toFixed(2)} ms is well below the 150 ms threshold! (p95: ${p95.toFixed(2)} ms)`);
    process.exit(0);
  } else {
    console.error(`❌ SLA FAILED: Average latency of ${avgTime.toFixed(2)} ms exceeded 150 ms.`);
    process.exit(1);
  }
}

runBenchmark(10000, 500, 25).catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
