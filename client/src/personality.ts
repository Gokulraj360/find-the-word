export type CognitorMood =
  | "opening"
  | "probing"
  | "confident"
  | "challenged"
  | "recalibrating"
  | "final_stretch"
  | "guessing";

export interface CognitorDialogue {
  mood: CognitorMood;
  moodLabel: string;
  line: string;
}

const DIALOGUE_POOLS: Record<CognitorMood, { label: string; lines: string[] }> = {
  opening: {
    label: "Attuning",
    lines: [
      "Focus your mind... I am tuning into your thoughts.",
      "Let me begin probing your memory.",
      "A fascinating choice... let us see where this leads.",
      "Think clearly about your selection.",
      "Searching the probability matrix for early signals."
    ]
  },
  probing: {
    label: "Analyzing",
    lines: [
      "Narrowing down the possibilities step by step.",
      "Analyzing the pattern of your responses.",
      "Interesting... that eliminates dozens of candidates.",
      "Every answer brings greater clarity to the matrix.",
      "The probability branches are separating nicely.",
      "A steady flow of clues. The picture is forming."
    ]
  },
  confident: {
    label: "Closing In",
    lines: [
      "The fog is lifting... I am getting very close.",
      "Your thought is taking distinct shape in my mind.",
      "I can almost see who or what you are thinking of.",
      "The probability trails are converging rapidly.",
      "You cannot hide this from me much longer.",
      "A breakthrough! The candidate pool has shrunk to a handful."
    ]
  },
  challenged: {
    label: "Intrigued",
    lines: [
      "Hmm, tricky one... you are making this difficult.",
      "You have chosen a cunning entity to test me with.",
      "My sensors detect unusual complexity here...",
      "Not quite following the usual trails... intriguing.",
      "A stubborn puzzle, but I shall crack it.",
      "You are putting my deduction algorithms to the test."
    ]
  },
  recalibrating: {
    label: "Recalibrating",
    lines: [
      "Back to the drawing board... let me dig deeper.",
      "Interesting diversion, but I am far from defeated.",
      "A minor miscalculation. Let us recalibrate the weights.",
      "Then who could it be? Let me probe from another angle.",
      "You caught me off guard, but the truth will out."
    ]
  },
  final_stretch: {
    label: "Final Countdown",
    lines: [
      "Running low on questions... time to concentrate.",
      "The pressure mounts, but the final answer is near.",
      "A race against the question limit!",
      "Only a few inquiries remain to reveal your secret."
    ]
  },
  guessing: {
    label: "Certain",
    lines: [
      "The probability peaks have converged. I know your secret.",
      "All clues point toward one undeniable conclusion...",
      "Prepare yourself... my deduction is complete.",
      "The matrix has spoken with resounding clarity.",
      "I have seen through the fog of thought."
    ]
  }
};

export function getCognitorDialogue(params: {
  step: number;
  certainty: number;
  state: "in_progress" | "guess_pending" | "won" | "lost";
  maxQuestions?: number;
  rejectedGuessesCount?: number;
  seedKey?: string;
}): CognitorDialogue {
  const {
    step,
    certainty,
    state,
    maxQuestions = 25,
    rejectedGuessesCount = 0,
    seedKey = "default"
  } = params;

  let mood: CognitorMood = "probing";

  if (state === "guess_pending") {
    mood = "guessing";
  } else if (rejectedGuessesCount > 0 && step % 2 === 1) {
    mood = "recalibrating";
  } else if (step <= 2) {
    mood = "opening";
  } else if (certainty >= 0.55) {
    mood = "confident";
  } else if (step >= maxQuestions - 4) {
    mood = "final_stretch";
  } else if (step >= 9 && certainty < 0.35) {
    mood = "challenged";
  } else {
    mood = "probing";
  }

  const pool = DIALOGUE_POOLS[mood];

  let hash = 0;
  const str = `${seedKey}:${step}:${mood}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }

  const index = hash % pool.lines.length;
  const line = pool.lines[index];

  return {
    mood,
    moodLabel: pool.label,
    line
  };
}
