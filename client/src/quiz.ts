export type QuizQuestionType = "visual_id" | "trait_match" | "fun_fact";

export interface QuizOption {
  entityId: number;
  name: string;
  imageUrl: string | null;
  category: "character" | "object";
}

export interface QuizQuestionClient {
  id: string;
  questionType: QuizQuestionType;
  prompt: string;
  subPrompt?: string;
  targetImageUrl?: string | null;
  options: QuizOption[];
}

export interface QuizStartResponse {
  sessionId: string;
  totalQuestions: number;
  question: QuizQuestionClient;
}

export interface QuizAnswerResponse {
  correct: boolean;
  correctEntityId: number;
  explanation: string;
  currentScore: number;
  totalQuestions: number;
  isFinished: boolean;
  nextQuestion: QuizQuestionClient | null;
}

export async function startQuiz(
  domain: "all" | "character" | "object" = "all",
  length: number = 5
): Promise<QuizStartResponse> {
  const res = await fetch("/api/quiz/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, length })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to start quiz (${res.status})`);
  }

  return res.json();
}

export async function submitQuizAnswer(
  sessionId: string,
  questionIndex: number,
  selectedEntityId: number
): Promise<QuizAnswerResponse> {
  const res = await fetch("/api/quiz/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, questionIndex, selectedEntityId })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to submit answer (${res.status})`);
  }

  return res.json();
}
