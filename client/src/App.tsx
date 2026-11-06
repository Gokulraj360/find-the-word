import React, { useState, useEffect, useCallback } from "react";
import { AdminPanel } from "./Admin.js";
import { sounds } from "./soundEffects.js";
import {
  UserStats,
  getUserStats,
  recordGameCompletion,
  resetUserStats,
  calculateWinRate,
  RecordResultOutcome
} from "./userStats.js";
import {
  Achievement,
  checkAndUnlockAchievements,
  resetAchievements
} from "./achievements.js";
import { StatsModal } from "./StatsModal.js";
import {
  DailyChallengeData,
  DailyResult,
  DailyStreakState,
  getDailyStreak,
  getTodayResult,
  recordDailyCompletion,
  generateShareText,
  copyShareText
} from "./dailyChallenge.js";
import { RoleReversalArena } from "./RoleReversalArena.js";
import { TwoPlayerArena } from "./TwoPlayerArena.js";
import { ChallengeCreatorModal } from "./ChallengeCreatorModal.js";
import { LeaderboardModal } from "./LeaderboardModal.js";
import { LeaderboardCategory } from "./leaderboard.js";
import { QuickQuizArena } from "./QuickQuizArena.js";
import {
  CategoryPackId,
  CategoryPackInfo,
  DEFAULT_PACKS,
  fetchCategoryPacks
} from "./categoryPacks.js";
import { CognitorDialogue, getCognitorDialogue } from "./personality.js";
import { triggerConfetti } from "./confetti.js";
import { saveGameHistoryEntry } from "./gameHistory.js";
import { GameHistoryModal } from "./GameHistoryModal.js";
import {
  ChallengeData,
  fetchChallengeDetails,
  getChallengeCodeFromUrl
} from "./friendChallenge.js";

interface Question {
  id: number;
  text: string;
  step: number;
}

interface CandidateGuess {
  entityId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  probability: number;
  funFact?: string | null;
}

interface HistoryItem {
  step: number;
  questionId: number;
  questionText: string;
  answerValue: number;
}

interface Stats {
  totalGames: number;
  wins: number;
  losses: number;
  activeEntities: number;
  activeQuestions: number;
  pendingSubmissions: number;
}

function answerLabel(val: number): string {
  if (val >= 0.95) return "Yes";
  if (val <= 0.05) return "No";
  if (val >= 0.7) return "Probably";
  if (val <= 0.3) return "Probably not";
  return "Don't know";
}

function answerBadgeClass(val: number): string {
  if (val >= 0.95) return "ans-pill-yes";
  if (val <= 0.05) return "ans-pill-no";
  if (val >= 0.7) return "ans-pill-prob";
  if (val <= 0.3) return "ans-pill-probnot";
  return "ans-pill-dk";
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(
    () => window.location.pathname === "/admin" || window.location.hash === "#admin"
  );

  const [stats, setStats] = useState<Stats | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<"character" | "object">("character");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [certainty, setCertainty] = useState<number>(0.05);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [guess, setGuess] = useState<CandidateGuess | null>(null);
  const [closestWrongEntity, setClosestWrongEntity] = useState<CandidateGuess | null>(null);
  const [gameState, setGameState] = useState<"idle" | "in_progress" | "guess_pending" | "won" | "lost">("idle");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [fallbackImage, setFallbackImage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);
  const [userStats, setUserStats] = useState<UserStats>(() => getUserStats());
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showGameHistoryModal, setShowGameHistoryModal] = useState(false);
  const [statsInitialTab, setStatsInitialTab] = useState<"stats" | "achievements">("stats");
  const [toastAchievement, setToastAchievement] = useState<Achievement | null>(null);
  const [latestUnlockedBadges, setLatestUnlockedBadges] = useState<Achievement[]>([]);
  const [lastResultOutcome, setLastResultOutcome] = useState<RecordResultOutcome | null>(null);

  // Daily Challenge state
  const [dailyData, setDailyData] = useState<DailyChallengeData | null>(null);
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(null);
  const [dailyStreak, setDailyStreak] = useState<DailyStreakState>(() => getDailyStreak());
  const [isDailyMode, setIsDailyMode] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<"easy" | "hard" | "expert">("easy");
  const [maxQuestions, setMaxQuestions] = useState<number>(25);

  // Thematic Category Packs state
  const [selectedPack, setSelectedPack] = useState<CategoryPackId>("all");
  const [availablePacks, setAvailablePacks] = useState<CategoryPackInfo[]>(DEFAULT_PACKS);

  // Personality Dialogue state
  const [currentDialogue, setCurrentDialogue] = useState<CognitorDialogue>({
    mood: "opening",
    moodLabel: "Attuning",
    line: "Focus your mind... I am tuning into your thoughts."
  });

  // Role Reversal mode state
  const [isReverseMode, setIsReverseMode] = useState<boolean>(false);
  const [reverseDomain, setReverseDomain] = useState<"character" | "object">("object");

  // Two-Player mode state
  const [isTwoPlayerMode, setIsTwoPlayerMode] = useState<boolean>(false);

  // Friend Challenge state
  const [showChallengeModal, setShowChallengeModal] = useState<boolean>(false);
  const [incomingChallenge, setIncomingChallenge] = useState<ChallengeData | null>(null);
  const [challengeCodeInput, setChallengeCodeInput] = useState<string>("");

  // Leaderboard state
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [leaderboardPrefill, setLeaderboardPrefill] = useState<{
    category: LeaderboardCategory;
    score: number;
    entityName?: string;
    domain?: "character" | "object";
    difficulty?: "easy" | "hard" | "expert";
  } | null>(null);
  const [activeChallengeCode, setActiveChallengeCode] = useState<string | undefined>(undefined);
  const [activeChallengeCreator, setActiveChallengeCreator] = useState<string | undefined>(undefined);
  const [challengeLookupError, setChallengeLookupError] = useState<string>("");

  // Quick Quiz mode state
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const [quizDomain, setQuizDomain] = useState<"all" | "character" | "object">("all");

  // Auto-dismiss achievement toast after 4.5 seconds
  useEffect(() => {
    if (!toastAchievement) return;
    const timer = setTimeout(() => {
      setToastAchievement(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastAchievement]);

  // Learn form state
  const [learnName, setLearnName] = useState("");
  const [learnQuestion, setLearnQuestion] = useState("");
  const [learnAnswer, setLearnAnswer] = useState<number>(1.0);
  const [learnSubmitted, setLearnSubmitted] = useState(false);

  // Load stats
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
  };

  // Load daily challenge
  const fetchDailyChallenge = async () => {
    try {
      const res = await fetch("/api/daily");
      if (res.ok) {
        const data: DailyChallengeData = await res.json();
        setDailyData(data);
        const result = getTodayResult(data.date);
        setDailyResult(result);
      }
    } catch {
      // ignore
    }
  };

  // Dynamically resolve Wikipedia image for an entity if primary image fails
  const resolveEntityImage = async (name: string) => {
    try {
      const res = await fetch(`/api/entity-image?name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setFallbackImage(data.imageUrl);
          setImageFailed(false);
        }
      }
    } catch {
      // fallback to monogram
    }
  };

  // Restore session from sessionStorage if page was refreshed
  const tryRestoreSession = async () => {
    const savedId = sessionStorage.getItem("cognitor_session_id");
    if (!savedId) return;

    try {
      const res = await fetch(`/api/game/state/${savedId}`);
      if (!res.ok) {
        sessionStorage.removeItem("cognitor_session_id");
        return;
      }
      const data = await res.json();
      if (data.domain) setCurrentDomain(data.domain);
      if (data.difficulty) setDifficulty(data.difficulty);
      if (data.maxQuestions) setMaxQuestions(data.maxQuestions);
      if (data.certainty !== undefined) setCertainty(data.certainty);
      if (data.history) setHistory(data.history);
      if (data.dialogue) setCurrentDialogue(data.dialogue);

      if (data.state === "in_progress" && data.question) {
        setSessionId(data.sessionId);
        setCurrentQuestion(data.question);
        setGameState("in_progress");
      } else if (data.state === "guess_pending" && data.guess) {
        setSessionId(data.sessionId);
        setGuess(data.guess);
        setGameState("guess_pending");
      }
    } catch {
      sessionStorage.removeItem("cognitor_session_id");
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDailyChallenge();
    fetchCategoryPacks().then((packs) => setAvailablePacks(packs));
    tryRestoreSession();

    // Check if user visited via a challenge URL (?challenge=COG-XXXX)
    const codeFromUrl = getChallengeCodeFromUrl();
    if (codeFromUrl) {
      fetchChallengeDetails(codeFromUrl)
        .then((data) => setIncomingChallenge(data))
        .catch(() => {});
    }

    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname === "/admin" || window.location.hash === "#admin");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handlePlayChallenge = (code: string, domain: "character" | "object", creator: string) => {
    setActiveChallengeCode(code);
    setActiveChallengeCreator(creator);
    setReverseDomain(domain);
    setIsReverseMode(true);
    setIncomingChallenge(null);
  };

  const handleManualChallengeLookup = async () => {
    const code = challengeCodeInput.trim().toUpperCase();
    if (!code) return;
    setChallengeLookupError("");
    try {
      const data = await fetchChallengeDetails(code);
      handlePlayChallenge(data.code, data.domain, data.creatorName);
      setChallengeCodeInput("");
    } catch {
      setChallengeLookupError("Challenge code not found. Check and try again.");
    }
  };

  const navigateToAdmin = () => {
    window.history.pushState({}, "", "/admin");
    setIsAdminRoute(true);
  };

  const navigateToHome = () => {
    window.history.pushState({}, "", "/");
    setIsAdminRoute(false);
    setIsReverseMode(false);
    setIsTwoPlayerMode(false);
    setActiveChallengeCode(undefined);
    setActiveChallengeCreator(undefined);
    fetchStats();
  };

  const toggleSound = () => {
    const next = sounds.toggle();
    setSoundEnabled(next);
  };

  const handleResetUserStats = () => {
    const reset = resetUserStats();
    resetAchievements();
    setUserStats(reset);
    setLastResultOutcome(null);
    setLatestUnlockedBadges([]);
  };

  const handleShareDaily = async () => {
    if (!dailyResult) return;
    const text = generateShareText(dailyResult, dailyStreak.currentStreak);
    const ok = await copyShareText(text);
    if (ok) {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const startDailyGame = () => {
    if (!dailyData) return;
    startGame(dailyData.entity.domain, true);
  };

  // Start new game
  const startGame = async (
    domain: "character" | "object" = "character",
    isDaily: boolean = false,
    diff?: "easy" | "hard" | "expert"
  ) => {
    const diffToUse = diff || difficulty;
    setDifficulty(diffToUse);
    setLoading(true);
    setErrorMsg("");
    setLastAction(null);
    setLastResultOutcome(null);
    setLatestUnlockedBadges([]);
    setIsDailyMode(isDaily);
    setCopiedShare(false);
    setLearnSubmitted(false);
    setLearnName("");
    setLearnQuestion("");
    setClosestWrongEntity(null);
    setImageFailed(false);
    setFallbackImage(null);
    setShowHistory(false);
    setCurrentDomain(domain);
    sessionStorage.removeItem("cognitor_session_id");

    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          difficulty: diffToUse,
          categoryPack: isDaily ? "all" : selectedPack
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start game");
      setSessionId(data.sessionId);
      sessionStorage.setItem("cognitor_session_id", data.sessionId);
      setCurrentQuestion(data.question);
      if (data.maxQuestions) setMaxQuestions(data.maxQuestions);
      if (data.certainty !== undefined) setCertainty(data.certainty);
      if (data.history) setHistory(data.history);
      if (data.dialogue) setCurrentDialogue(data.dialogue);
      setGuess(null);
      setGameState("in_progress");
    } catch (err: any) {
      setErrorMsg(err.message);
      setLastAction(() => () => startGame(domain));
    } finally {
      setLoading(false);
    }
  };

  // Submit answer
  const submitAnswer = useCallback(
    async (answerVal: number) => {
      if (!sessionId || loading) return;
      setLoading(true);
      setErrorMsg("");
      setLastAction(null);

      // Play audio chime
      sounds.playAnswerChime(answerVal);

      try {
        const res = await fetch("/api/game/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, answer: answerVal })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to process answer");

        if (data.certainty !== undefined) setCertainty(data.certainty);
        if (data.history) setHistory(data.history);
        if (data.dialogue) setCurrentDialogue(data.dialogue);

        if (data.state === "guess_pending" && data.guess) {
          setGuess(data.guess);
          setImageFailed(false);
          setFallbackImage(null);
          setGameState("guess_pending");
          sounds.playDeductionReveal();

          if (!data.guess.imageUrl) {
            resolveEntityImage(data.guess.name);
          }
        } else if (data.state === "in_progress" && data.question) {
          setCurrentQuestion(data.question);
          setGameState("in_progress");
        } else if (data.state === "lost") {
          sessionStorage.removeItem("cognitor_session_id");
          setGameState("lost");
          sounds.playDefeat();
          triggerConfetti({ count: 70 });
          const questionsUsed = currentQuestion ? currentQuestion.step : history.length;
          const outcome = recordGameCompletion("lost", questionsUsed, currentDomain);
          setUserStats(outcome.stats);
          setLastResultOutcome(outcome);
          saveGameHistoryEntry({
            domain: currentDomain,
            difficulty,
            pack: selectedPack,
            entityName: guess?.name || "Unknown Entity",
            entityDescription: guess?.description,
            imageUrl: guess?.imageUrl,
            result: "lost",
            stumpedCognitor: true,
            questionsCount: questionsUsed,
            questions: history.map((h) => ({
              step: h.step,
              text: h.questionText,
              answerValue: h.answerValue,
              answerLabel: answerLabel(h.answerValue)
            }))
          });
          if (isDailyMode && dailyData) {
            const dailyRec = recordDailyCompletion(dailyData, false, questionsUsed);
            setDailyResult(dailyRec.result);
            setDailyStreak(dailyRec.streak);
          }
          const achResult = checkAndUnlockAchievements(outcome.stats, {
            outcome: "lost",
            questionsUsed,
            domain: currentDomain,
            difficulty
          });
          if (achResult.newlyUnlocked.length > 0) {
            sounds.playAchievement();
            setToastAchievement(achResult.newlyUnlocked[0]);
            setLatestUnlockedBadges(achResult.newlyUnlocked);
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message);
        setLastAction(() => () => submitAnswer(answerVal));
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loading, currentDomain, currentQuestion, history, isDailyMode, dailyData, difficulty]
  );

  // Back / Undo
  const handleBack = useCallback(async () => {
    if (!sessionId || loading || (currentQuestion && currentQuestion.step <= 1)) return;
    setLoading(true);
    setErrorMsg("");
    setLastAction(null);

    try {
      const res = await fetch("/api/game/back", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to undo");

      setCurrentQuestion(data.question);
      if (data.certainty !== undefined) setCertainty(data.certainty);
      if (data.history) setHistory(data.history);
      if (data.question) {
        const d = getCognitorDialogue({
          step: data.question.step,
          certainty: data.certainty || 0.1,
          state: "in_progress",
          seedKey: sessionId
        });
        setCurrentDialogue(d);
      }
      setGuess(null);
      setImageFailed(false);
      setFallbackImage(null);
      setGameState("in_progress");
    } catch (err: any) {
      setErrorMsg(err.message);
      setLastAction(() => handleBack);
    } finally {
      setLoading(false);
    }
  }, [sessionId, loading, currentQuestion]);

  // Jump to specific step by rewinding
  const jumpToStep = async (targetStep: number) => {
    if (!sessionId || loading || !currentQuestion || targetStep >= currentQuestion.step) return;
    setLoading(true);
    setErrorMsg("");
    try {
      let currentStep = currentQuestion.step;
      let lastData: any = null;
      while (currentStep > targetStep) {
        const res = await fetch("/api/game/back", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
        lastData = await res.json();
        if (!res.ok) break;
        currentStep = lastData.question?.step ?? targetStep;
      }
      if (lastData && lastData.question) {
        setCurrentQuestion(lastData.question);
        if (lastData.certainty !== undefined) setCertainty(lastData.certainty);
        if (lastData.history) setHistory(lastData.history);
        const d = getCognitorDialogue({
          step: lastData.question.step,
          certainty: lastData.certainty || 0.1,
          state: "in_progress",
          seedKey: sessionId
        });
        setCurrentDialogue(d);
        setGuess(null);
        setGameState("in_progress");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm guess
  const confirmGuess = useCallback(
    async (correct: boolean) => {
      if (!sessionId || !guess || loading) return;
      setLoading(true);
      setErrorMsg("");
      setLastAction(null);

      try {
        const res = await fetch("/api/game/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            correct,
            entityId: guess.entityId
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to confirm guess");

        if (data.certainty !== undefined) setCertainty(data.certainty);
        if (data.history) setHistory(data.history);

        if (correct || data.state === "won") {
          sessionStorage.removeItem("cognitor_session_id");
          setGameState("won");
          if (data.guess) {
            setGuess(data.guess);
          }
          sounds.playVictory();
          sounds.playConfettiPop();
          triggerConfetti();
          fetchStats();
          const questionsUsed = currentQuestion ? currentQuestion.step : history.length;
          const outcome = recordGameCompletion("won", questionsUsed, currentDomain);
          setUserStats(outcome.stats);
          setLastResultOutcome(outcome);
          saveGameHistoryEntry({
            domain: currentDomain,
            difficulty,
            pack: selectedPack,
            entityName: guess?.name || data.guess?.name || "Unknown Entity",
            entityDescription: guess?.description || data.guess?.description,
            imageUrl: guess?.imageUrl || data.guess?.imageUrl,
            result: "won",
            stumpedCognitor: false,
            questionsCount: questionsUsed,
            questions: history.map((h) => ({
              step: h.step,
              text: h.questionText,
              answerValue: h.answerValue,
              answerLabel: answerLabel(h.answerValue)
            }))
          });
          if (isDailyMode && dailyData) {
            const wonDaily = guess?.entityId === dailyData.entity.id;
            const dailyRec = recordDailyCompletion(dailyData, wonDaily, questionsUsed);
            setDailyResult(dailyRec.result);
            setDailyStreak(dailyRec.streak);
          }
          const achResult = checkAndUnlockAchievements(outcome.stats, {
            outcome: "won",
            questionsUsed,
            domain: currentDomain,
            difficulty
          });
          if (achResult.newlyUnlocked.length > 0) {
            sounds.playAchievement();
            setToastAchievement(achResult.newlyUnlocked[0]);
            setLatestUnlockedBadges(achResult.newlyUnlocked);
          }
        } else {
          if (data.closestWrongEntity) {
            setClosestWrongEntity(data.closestWrongEntity);
          } else {
            setClosestWrongEntity(guess);
          }

          if (data.state === "lost") {
            sessionStorage.removeItem("cognitor_session_id");
            setGameState("lost");
            sounds.playDefeat();
            triggerConfetti({ count: 70 });
            fetchStats();
            const questionsUsed = currentQuestion ? currentQuestion.step : history.length;
            const outcome = recordGameCompletion("lost", questionsUsed, currentDomain);
            setUserStats(outcome.stats);
            setLastResultOutcome(outcome);
            saveGameHistoryEntry({
              domain: currentDomain,
              difficulty,
              pack: selectedPack,
              entityName: data.closestWrongEntity?.name || guess?.name || "Unknown Entity",
              entityDescription: data.closestWrongEntity?.description || guess?.description,
              imageUrl: data.closestWrongEntity?.imageUrl || guess?.imageUrl,
              result: "lost",
              stumpedCognitor: true,
              questionsCount: questionsUsed,
              questions: history.map((h) => ({
                step: h.step,
                text: h.questionText,
                answerValue: h.answerValue,
                answerLabel: answerLabel(h.answerValue)
              }))
            });
            if (isDailyMode && dailyData) {
              const dailyRec = recordDailyCompletion(dailyData, false, questionsUsed);
              setDailyResult(dailyRec.result);
              setDailyStreak(dailyRec.streak);
            }
            const achResult = checkAndUnlockAchievements(outcome.stats, {
              outcome: "lost",
              questionsUsed,
              domain: currentDomain,
              difficulty
            });
            if (achResult.newlyUnlocked.length > 0) {
              sounds.playAchievement();
              setToastAchievement(achResult.newlyUnlocked[0]);
              setLatestUnlockedBadges(achResult.newlyUnlocked);
            }
          } else if (data.question) {
            setCurrentQuestion(data.question);
            setGuess(null);
            setImageFailed(false);
            setFallbackImage(null);
            setGameState("in_progress");
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message);
        setLastAction(() => () => confirmGuess(correct));
      } finally {
        setLoading(false);
      }
    },
    [sessionId, guess, loading, currentDomain, currentQuestion, history, isDailyMode, dailyData, difficulty]
  );

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (gameState === "in_progress") {
        if (e.key === "1" || e.key.toLowerCase() === "y") submitAnswer(1.0);
        else if (e.key === "2" || e.key.toLowerCase() === "n") submitAnswer(0.0);
        else if (e.key === "3" || e.key.toLowerCase() === "d") submitAnswer(0.5);
        else if (e.key === "4" || e.key.toLowerCase() === "p") submitAnswer(0.75);
        else if (e.key === "5") submitAnswer(0.25);
        else if (e.key === "Backspace" || e.key.toLowerCase() === "u") handleBack();
      } else if (gameState === "guess_pending") {
        if (e.key.toLowerCase() === "y" || e.key === "Enter") confirmGuess(true);
        else if (e.key.toLowerCase() === "n" || e.key === "Escape") confirmGuess(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, submitAnswer, handleBack, confirmGuess]);

  // Submit learning form on loss
  const handleLearnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !learnName.trim() || !learnQuestion.trim() || loading) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/game/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          entityName: learnName.trim(),
          questionText: learnQuestion.trim(),
          answer: learnAnswer
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit learning data");
      setLearnSubmitted(true);
      fetchStats();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resolve best image URL for deduction
  const activeImageUrl = fallbackImage || guess?.imageUrl || null;
  const proxiedImageUrl = activeImageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(activeImageUrl)}`
    : null;

  return (
    <div className="akinator-app">
      {/* HEADER */}
      <header className="akinator-nav">
        <div className="nav-brand-group">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateToHome();
            }}
            className="brand-logo-link"
          >
            <span className="brand-logo-text">Cognitor</span>
          </a>
        </div>

        <div className="nav-controls">
          <button
            className="stats-toggle-btn leaderboard-nav-btn"
            onClick={() => {
              setLeaderboardPrefill(null);
              setShowLeaderboardModal(true);
            }}
            title="Global Leaderboards"
            aria-label="View Leaderboards"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34"></path>
              <path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34"></path>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
            </svg>
          </button>

          <button
            className="stats-toggle-btn"
            onClick={() => setShowStatsModal(true)}
            title="Player Stats & Streaks"
            aria-label="View Stats and Streaks"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            {userStats.currentStreak > 1 && (
              <span className="nav-streak-badge" title={`${userStats.currentStreak} deduction streak`}>
                {userStats.currentStreak}
              </span>
            )}
          </button>

          <button
            className="stats-toggle-btn"
            onClick={() => setShowGameHistoryModal(true)}
            title="Game History (Last 10 Games)"
            aria-label="View Game History"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </button>

          <button
            className="sound-toggle-btn"
            onClick={toggleSound}
            title={soundEnabled ? "Mute audio" : "Enable audio"}
            aria-label="Toggle sound"
          >
            {soundEnabled ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            )}
          </button>

          {(gameState !== "idle" || isReverseMode || isTwoPlayerMode) && !isAdminRoute && (
            <button
              className="nav-reset-btn"
              onClick={() => {
                setGameState("idle");
                setIsReverseMode(false);
                setIsTwoPlayerMode(false);
                setActiveChallengeCode(undefined);
                setActiveChallengeCreator(undefined);
                sessionStorage.removeItem("cognitor_session_id");
              }}
            >
              {isTwoPlayerMode ? "Exit 2-Player" : isReverseMode ? "Exit Reversal" : "New Game"}
            </button>
          )}
        </div>
      </header>

      {errorMsg && (
        <div className="akinator-error-banner">
          <span>{errorMsg}</span>
          {lastAction && (
            <button className="btn btn-danger btn-sm" onClick={lastAction}>
              Retry
            </button>
          )}
        </div>
      )}

      {isAdminRoute ? (
        <main className="akinator-main">
          <AdminPanel onBack={navigateToHome} />
        </main>
      ) : isTwoPlayerMode ? (
        <main className="akinator-main">
          <TwoPlayerArena onExit={() => setIsTwoPlayerMode(false)} />
        </main>
      ) : isQuizMode ? (
        <main className="akinator-main">
          <QuickQuizArena
            initialDomain={quizDomain}
            onClose={() => setIsQuizMode(false)}
          />
        </main>
      ) : isReverseMode ? (
        <main className="akinator-main">
          <RoleReversalArena
            domain={reverseDomain}
            challengeCode={activeChallengeCode}
            challengeCreator={activeChallengeCreator}
            onExit={() => {
              setIsReverseMode(false);
              setActiveChallengeCode(undefined);
              setActiveChallengeCreator(undefined);
            }}
          />
        </main>
      ) : (
        <main className="akinator-main">
          {/* ============================================================ */}
          {/* WELCOME / IDLE ARENA */}
          {/* ============================================================ */}
          {gameState === "idle" && (
            <div className="arena-welcome-card">
              <div className="welcome-speech-bubble">
                <h1 className="bubble-hero-title">Think of a character or object</h1>
                <p className="bubble-hero-subtitle">
                  I will deduce who or what you are thinking of through a series of questions. Choose your domain to begin.
                </p>
              </div>

              {incomingChallenge && (
                <div className="incoming-challenge-card">
                  <div className="incoming-challenge-badge">Friend Challenge Received</div>
                  <h3 className="incoming-challenge-title">
                    {incomingChallenge.creatorName} challenged you!
                  </h3>
                  <p className="incoming-challenge-desc">
                    Can you deduce {incomingChallenge.creatorName}'s secret {incomingChallenge.domain === "character" ? "Character" : "Object"} in under 20 questions?
                  </p>
                  <div className="incoming-challenge-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        handlePlayChallenge(
                          incomingChallenge.code,
                          incomingChallenge.domain,
                          incomingChallenge.creatorName
                        )
                      }
                      type="button"
                    >
                      Accept Challenge
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setIncomingChallenge(null)}
                      type="button"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {dailyData && (
                <div className="daily-challenge-card">
                  <div className="daily-header-row">
                    <span className="daily-eyebrow">
                      Daily Challenge #{dailyData.dayNumber} · {dailyData.date}
                    </span>
                    {dailyStreak.currentStreak > 0 && (
                      <span className="daily-streak-badge">
                        {dailyStreak.currentStreak} Day Streak
                      </span>
                    )}
                  </div>

                  <div className="daily-target-display">
                    <span className="daily-target-label">
                      {dailyResult ? "Today's Target" : "Secret Target to Think Of"}
                    </span>
                    <span className="daily-target-name">{dailyData.entity.name}</span>
                    {dailyData.entity.description && (
                      <p className="daily-target-desc">{dailyData.entity.description}</p>
                    )}
                  </div>

                  <div className="daily-actions-row">
                    {!dailyResult ? (
                      <button
                        className="daily-play-btn"
                        onClick={startDailyGame}
                        disabled={loading}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <span>Play Today's Challenge</span>
                      </button>
                    ) : (
                      <>
                        <div className="daily-completed-status">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>
                            {dailyResult.won
                              ? `Solved in ${dailyResult.questionsCount} questions`
                              : "You beat Cognitor!"}
                          </span>
                        </div>
                        <button
                          className="daily-share-btn"
                          onClick={handleShareDaily}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                          </svg>
                          <span>{copiedShare ? "Copied to Clipboard!" : "Share Result"}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="difficulty-selector-group">
                <span className="difficulty-group-label">Difficulty Mode</span>
                <div className="difficulty-btn-row">
                  <button
                    className={`difficulty-btn ${difficulty === "easy" ? "difficulty-btn-selected" : ""}`}
                    onClick={() => {
                      setDifficulty("easy");
                      setMaxQuestions(25);
                    }}
                    type="button"
                  >
                    <span className="diff-title">Easy</span>
                    <span className="diff-desc">Common items · 25 questions</span>
                  </button>

                  <button
                    className={`difficulty-btn ${difficulty === "hard" ? "difficulty-btn-selected" : ""}`}
                    onClick={() => {
                      setDifficulty("hard");
                      setMaxQuestions(20);
                    }}
                    type="button"
                  >
                    <span className="diff-title">Hard</span>
                    <span className="diff-desc">Rare & niche · 20 questions</span>
                  </button>

                  <button
                    className={`difficulty-btn diff-expert ${difficulty === "expert" ? "difficulty-btn-selected" : ""}`}
                    onClick={() => {
                      setDifficulty("expert");
                      setMaxQuestions(15);
                    }}
                    type="button"
                  >
                    <span className="diff-title">Expert</span>
                    <span className="diff-desc">Speed trial · 15 questions max</span>
                  </button>
                </div>
              </div>

              <div className="pack-selection-section">
                <div className="pack-header-row">
                  <span className="diff-label">Thematic Category Pack:</span>
                  <span className="pack-sublabel">
                    {availablePacks.find((p) => p.id === selectedPack)?.description}
                  </span>
                </div>
                <div className="pack-pill-row">
                  {availablePacks.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      className={`pack-pill-btn ${selectedPack === pack.id ? "pack-pill-active" : ""}`}
                      onClick={() => setSelectedPack(pack.id)}
                    >
                      <span className="pack-pill-title">{pack.title}</span>
                      <span className="pack-pill-count">{pack.itemCount}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="domain-selection-grid">
                <button
                  className={`domain-card ${currentDomain === "character" ? "domain-selected" : ""}`}
                  onClick={() => startGame("character")}
                  disabled={loading}
                >
                  <div className="domain-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="domain-card-content">
                    <span className="domain-card-label">Living and Fictional</span>
                    <span className="domain-card-title">Characters and Figures</span>
                    <span className="domain-card-desc">
                      Real celebrities, historical leaders, anime icons, superheroes, and authors.
                    </span>
                  </div>
                </button>

                <button
                  className={`domain-card ${currentDomain === "object" ? "domain-selected" : ""}`}
                  onClick={() => startGame("object")}
                  disabled={loading}
                >
                  <div className="domain-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </div>
                  <div className="domain-card-content">
                    <span className="domain-card-label">Everyday World</span>
                    <span className="domain-card-title">Objects and Items</span>
                    <span className="domain-card-desc">
                      Electronics, appliances, vehicles, musical instruments, tools, and household gear.
                    </span>
                  </div>
                </button>
              </div>

              <div className="reverse-mode-launch-card">
                <div className="reverse-launch-header">
                  <span className="reverse-launch-badge">Special Game Mode</span>
                  <h3 className="reverse-launch-title">Role Reversal: You Guess, Cognitor Answers</h3>
                  <p className="reverse-launch-desc">
                    Cognitor secretly picks an entity from the database. Ask up to 20 yes/no questions and use your 3 guesses to deduce who or what it is.
                  </p>
                </div>
                <div className="reverse-launch-actions">
                  <button
                    className="btn btn-secondary reversal-launch-btn"
                    onClick={() => {
                      setReverseDomain("object");
                      setIsReverseMode(true);
                    }}
                    type="button"
                  >
                    <span>Play Objects Mode</span>
                  </button>
                  <button
                    className="btn btn-secondary reversal-launch-btn"
                    onClick={() => {
                      setReverseDomain("character");
                      setIsReverseMode(true);
                    }}
                    type="button"
                  >
                    <span>Play Characters Mode</span>
                  </button>
                  <button
                    className="btn btn-secondary reversal-launch-btn"
                    onClick={() => setIsTwoPlayerMode(true)}
                    type="button"
                  >
                    <span>2-Player Local Duel</span>
                  </button>
                </div>
              </div>

              <div className="friend-challenge-launch-card">
                <div className="friend-launch-header">
                  <span className="reverse-launch-badge">Social Mode</span>
                  <h3 className="reverse-launch-title">Challenge a Friend & 2-Player</h3>
                  <p className="reverse-launch-desc">
                    Pick a secret target to generate a private link, or play a pass-and-play duel right on this device!
                  </p>
                </div>

                <div className="friend-launch-controls">
                  <button
                    className="btn btn-primary friend-create-btn"
                    onClick={() => setShowChallengeModal(true)}
                    type="button"
                  >
                    <span>Create Challenge Link</span>
                  </button>

                  <button
                    className="btn btn-secondary friend-create-btn"
                    onClick={() => setIsTwoPlayerMode(true)}
                    type="button"
                  >
                    <span>Same-Device 2-Player</span>
                  </button>

                  <div className="friend-code-inline-form">
                    <input
                      type="text"
                      className="friend-code-input"
                      placeholder="Code (e.g. COG-4X9B)"
                      value={challengeCodeInput}
                      onChange={(e) => {
                        setChallengeCodeInput(e.target.value.toUpperCase());
                        setChallengeLookupError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleManualChallengeLookup();
                      }}
                      maxLength={12}
                    />
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleManualChallengeLookup}
                      disabled={!challengeCodeInput.trim()}
                      type="button"
                    >
                      Play
                    </button>
                  </div>
                </div>
                {challengeLookupError && (
                  <span className="friend-lookup-error">{challengeLookupError}</span>
                )}
              </div>

              <div className="quiz-mode-launch-card">
                <div className="reverse-launch-header">
                  <span className="reverse-launch-badge">Trivia & Knowledge</span>
                  <h3 className="reverse-launch-title">Quick Quiz: Test Your Deduction Knowledge</h3>
                  <p className="reverse-launch-desc">
                    Cognitor quizzes you! Identify characters and objects by their pictures, matrix traits, and fascinating fun facts across 5 rapid rounds.
                  </p>
                </div>
                <div className="reverse-launch-actions">
                  <button
                    className="btn btn-secondary reversal-launch-btn"
                    onClick={() => {
                      setQuizDomain("all");
                      setIsQuizMode(true);
                    }}
                    type="button"
                  >
                    <span>Play All Items</span>
                  </button>
                  <button
                    className="btn btn-secondary reversal-launch-btn"
                    onClick={() => {
                      setQuizDomain("object");
                      setIsQuizMode(true);
                    }}
                    type="button"
                  >
                    <span>Play Objects Quiz</span>
                  </button>
                  <button
                    className="btn btn-secondary reversal-launch-btn"
                    onClick={() => {
                      setQuizDomain("character");
                      setIsQuizMode(true);
                    }}
                    type="button"
                  >
                    <span>Play Characters Quiz</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ACTIVE QUESTION ARENA (AKINATOR-STYLE) */}
          {/* ============================================================ */}
          {gameState === "in_progress" && currentQuestion && (
            <div className="arena-game-card">
              {isDailyMode && dailyData && (
                <div className="daily-active-banner">
                  <span className="daily-active-tag">Daily Challenge #{dailyData.dayNumber}</span>
                  <span className="daily-active-target">Thinking of: {dailyData.entity.name}</span>
                </div>
              )}

              {/* Turn Indicator */}
              <div className="arena-step-header">
                <span className="q-step-badge">Question {currentQuestion.step} of {maxQuestions}</span>
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  {selectedPack !== "all" && (
                    <span className="mode-pill mode-pill-pack">
                      {availablePacks.find((p) => p.id === selectedPack)?.title}
                    </span>
                  )}
                  <span className={`mode-pill mode-pill-${difficulty}`}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode
                  </span>
                </div>
              </div>

              {/* Speech Bubble Stage */}
              <div className="dialogue-stage">
                {currentDialogue && (
                  <div className="cognitor-speech-strip">
                    <div className={`cognitor-mood-pill mood-${currentDialogue.mood}`}>
                      <span className="cognitor-avatar-dot" />
                      <span className="cognitor-mood-label">{currentDialogue.moodLabel}</span>
                    </div>
                    <p className="cognitor-dialogue-quote">"{currentDialogue.line}"</p>
                  </div>
                )}
                <div className="question-speech-bubble">
                  <p className="bubble-question-text">{currentQuestion.text}</p>
                </div>
              </div>

              {/* 5 Akinator Answers in Classic Ergonomic Order */}
              <div className="answers-grid">
                <button
                  className="akinator-btn btn-yes"
                  onClick={() => submitAnswer(1.0)}
                  disabled={loading}
                >
                  <span className="btn-text">Yes</span>
                  <kbd className="btn-kbd">1</kbd>
                </button>

                <button
                  className="akinator-btn btn-no"
                  onClick={() => submitAnswer(0.0)}
                  disabled={loading}
                >
                  <span className="btn-text">No</span>
                  <kbd className="btn-kbd">2</kbd>
                </button>

                <button
                  className="akinator-btn btn-dontknow"
                  onClick={() => submitAnswer(0.5)}
                  disabled={loading}
                >
                  <span className="btn-text">Don't know</span>
                  <kbd className="btn-kbd">3</kbd>
                </button>

                <button
                  className="akinator-btn btn-probably"
                  onClick={() => submitAnswer(0.75)}
                  disabled={loading}
                >
                  <span className="btn-text">Probably</span>
                  <kbd className="btn-kbd">4</kbd>
                </button>

                <button
                  className="akinator-btn btn-probnot"
                  onClick={() => submitAnswer(0.25)}
                  disabled={loading}
                >
                  <span className="btn-text">Probably not</span>
                  <kbd className="btn-kbd">5</kbd>
                </button>
              </div>

              {/* Utility Sub-actions */}
              <div className="arena-sub-actions">
                <div className="sub-left">
                  <button
                    className="sub-btn"
                    onClick={handleBack}
                    disabled={loading || currentQuestion.step <= 1}
                    title="Undo previous answer (Backspace)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 14 4 9 9 4"></polyline>
                      <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                    </svg>
                    <span>Previous Question</span>
                  </button>

                  {history.length > 0 && (
                    <button
                      className={`sub-btn ${showHistory ? "sub-btn-active" : ""}`}
                      onClick={() => setShowHistory(!showHistory)}
                      title="View question history"
                    >
                      <span>Question Log ({history.length})</span>
                    </button>
                  )}
                </div>

                <button
                  className="sub-btn"
                  onClick={() => startGame(currentDomain)}
                  disabled={loading}
                  title="Restart from Question 1"
                >
                  Restart
                </button>
              </div>

              {/* History Timeline Drawer */}
              {showHistory && history.length > 0 && (
                <div className="history-drawer-panel">
                  <div className="history-drawer-head">
                    <span className="history-drawer-title">Question History</span>
                    <span className="history-drawer-hint">Select a question to rewind to that turn</span>
                  </div>
                  <div className="history-rows-scroll">
                    {history.map((h) => (
                      <div key={h.step} className="history-row-item">
                        <span className="h-step-pill">Q{h.step}</span>
                        <span className="h-text">{h.questionText}</span>
                        <span className={`h-badge ${answerBadgeClass(h.answerValue)}`}>
                          {answerLabel(h.answerValue)}
                        </span>
                        <button
                          className="h-rewind-btn"
                          onClick={() => jumpToStep(h.step)}
                          disabled={loading}
                          title={`Return to question ${h.step}`}
                        >
                          Rewind
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* THE DEDUCTION CARD ("I THINK OF...") */}
          {/* ============================================================ */}
          {gameState === "guess_pending" && guess && (
            <div className="arena-deduction-card">
              <div className="deduction-header">
                <span className="deduction-eyebrow">My Deduction</span>
                <h2 className="deduction-reveal-text">I think of...</h2>
                {currentDialogue && (
                  <p className="deduction-cognitor-quote">"{currentDialogue.line}"</p>
                )}
              </div>

              <div className="deduction-portrait-wrapper">
                {proxiedImageUrl && !imageFailed ? (
                  <img
                    src={proxiedImageUrl}
                    alt={guess.name}
                    className="deduction-portrait-image"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      setImageFailed(true);
                      if (!fallbackImage) {
                        resolveEntityImage(guess.name);
                      }
                    }}
                  />
                ) : (
                  <div className="deduction-portrait-monogram">
                    <span>{guess.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <h3 className="deduction-entity-name">{guess.name}</h3>
              {guess.description && (
                <p className="deduction-entity-desc">{guess.description}</p>
              )}

              <p className="deduction-confirm-prompt">
                Is this who or what you were thinking of?
              </p>

              <div className="deduction-button-row">
                <button
                  className="akinator-confirm-btn confirm-yes"
                  onClick={() => confirmGuess(true)}
                  disabled={loading}
                >
                  <span>Yes, that's it!</span>
                </button>
                <button
                  className="akinator-confirm-btn confirm-no"
                  onClick={() => confirmGuess(false)}
                  disabled={loading}
                >
                  <span>No</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* WON SCREEN (CONFIRMED DEDUCTION) */}
          {/* ============================================================ */}
          {gameState === "won" && (
            <div className="arena-result-grid">
              <div className="arena-result-summary-card">
                <span className="result-trophy-tag">Deduction Confirmed</span>
                <h2 className="result-title">Mind Read Successfully</h2>
                <p className="result-detail">
                  I correctly deduced your thought in {currentQuestion ? currentQuestion.step : "a few"} questions ({difficulty} mode{selectedPack !== "all" ? ` · ${availablePacks.find((p) => p.id === selectedPack)?.title}` : ""}).
                </p>

                <div className="player-stats-banner">
                  <div className="stat-pill">
                    <span className="stat-pill-label">Streak</span>
                    <span className="stat-pill-val">{userStats.currentStreak} in a row</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-pill-label">Fastest Guess</span>
                    <span className="stat-pill-val">
                      {userStats.fastestGuess !== null ? `${userStats.fastestGuess} Qs` : "-"}
                    </span>
                    {lastResultOutcome?.isNewBest && (
                      <span className="stat-pill-tag">New Record!</span>
                    )}
                  </div>
                  <div className="stat-pill">
                    <span className="stat-pill-label">Accuracy</span>
                    <span className="stat-pill-val">{calculateWinRate(userStats)}%</span>
                  </div>
                </div>

                {latestUnlockedBadges.length > 0 && (
                  <div
                    className="new-achievements-shelf"
                    onClick={() => {
                      setStatsInitialTab("achievements");
                      setShowStatsModal(true);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="shelf-title">Badge Unlocked!</span>
                    <div className="shelf-badge-list">
                      {latestUnlockedBadges.map((b) => (
                        <span key={b.id} className="shelf-badge-item">
                          {b.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {isDailyMode && dailyResult && (
                  <div className="daily-challenge-card" style={{ margin: "1rem 0" }}>
                    <div className="daily-header-row">
                      <span className="daily-eyebrow">Daily Challenge #{dailyResult.dayNumber} Result</span>
                      {dailyStreak.currentStreak > 0 && (
                        <span className="daily-streak-badge">{dailyStreak.currentStreak} Day Streak</span>
                      )}
                    </div>
                    <p className="daily-target-desc">
                      Cognitor deduced {dailyResult.targetName} in {dailyResult.questionsCount} questions!
                    </p>
                    <button className="daily-share-btn" onClick={handleShareDaily}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                      <span>{copiedShare ? "Copied to Clipboard!" : "Share Daily Result"}</span>
                    </button>
                    {dailyData?.entity.funFact && (
                      <p className="daily-fun-fact-text">
                        <strong>Did you know?</strong> {dailyData.entity.funFact}
                      </p>
                    )}
                  </div>
                )}

                {guess && (
                  <div className="result-entity-preview">
                    {proxiedImageUrl && !imageFailed ? (
                      <img
                        src={proxiedImageUrl}
                        alt={guess.name}
                        className="result-preview-image"
                      />
                    ) : (
                      <div className="result-preview-monogram">
                        <span>{guess.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="result-preview-meta">
                      <span className="result-preview-name">{guess.name}</span>
                      {guess.description && (
                        <span className="result-preview-desc">{guess.description}</span>
                      )}
                    </div>
                  </div>
                )}

                {guess && guess.funFact && (
                  <div className="fun-fact-card">
                    <div className="fun-fact-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6"></path>
                        <path d="M10 22h4"></path>
                        <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7Z"></path>
                      </svg>
                      <span className="fun-fact-title">Did You Know?</span>
                    </div>
                    <p className="fun-fact-text">{guess.funFact}</p>
                  </div>
                )}

                <div className="result-btn-group">
                  <button
                    className="akinator-btn btn-yes"
                    onClick={() => startGame(currentDomain)}
                  >
                    Play Again
                  </button>
                  <button
                    className="akinator-btn btn-probably"
                    onClick={() => startGame(currentDomain === "object" ? "character" : "object")}
                  >
                    Switch to {currentDomain === "object" ? "Characters" : "Objects"}
                  </button>
                  <button
                    className="akinator-btn btn-dontknow"
                    onClick={() => {
                      const questionsUsed = currentQuestion ? currentQuestion.step : history.length;
                      if (isDailyMode) {
                        setLeaderboardPrefill({
                          category: "daily",
                          score: dailyResult ? dailyResult.questionsCount : questionsUsed,
                          entityName: dailyResult ? dailyResult.targetName : guess?.name,
                          domain: currentDomain,
                          difficulty
                        });
                      } else {
                        setLeaderboardPrefill({
                          category: "fastest_guess",
                          score: questionsUsed,
                          entityName: guess?.name,
                          domain: currentDomain,
                          difficulty
                        });
                      }
                      setShowLeaderboardModal(true);
                    }}
                  >
                    Submit to Leaderboard
                  </button>
                  <button
                    className="akinator-btn btn-probnot"
                    onClick={() => setShowGameHistoryModal(true)}
                  >
                    Game History
                  </button>
                </div>
              </div>

              {history.length > 0 && (
                <div className="arena-result-pathway-card">
                  <div className="trail-title">Key Deduction Pathway</div>
                  <div className="trail-list">
                    {history.map((h) => (
                      <div key={h.step} className="trail-item">
                        <span className="trail-step">#{h.step}</span>
                        <span className="trail-q">{h.questionText}</span>
                        <span className={`h-badge ${answerBadgeClass(h.answerValue)}`}>
                          {answerLabel(h.answerValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* LOST SCREEN (STUMPED / DEFEATED) */}
          {/* ============================================================ */}
          {gameState === "lost" && (
            <div className="arena-result-card">
              <span className="result-trophy-tag">Well Played</span>
              <h2 className="result-title">You Defeated Me</h2>
              <p className="result-detail">
                I could not deduce who or what you were thinking of within the {maxQuestions}-question limit ({difficulty} mode). Teach Cognitor what you were thinking of to sharpen future games.
              </p>

              <div className="player-stats-banner">
                <div className="stat-pill stat-pill-highlight">
                  <span className="stat-pill-label">Times You Stumped Cognitor</span>
                  <span className="stat-pill-val">{userStats.stumpedCount}</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">Total Games</span>
                  <span className="stat-pill-val">{userStats.gamesPlayed}</span>
                </div>
              </div>

              <div style={{ textAlign: "center", margin: "0.75rem 0" }}>
                <button
                  type="button"
                  className="game-btn game-btn-secondary"
                  onClick={() => {
                    setLeaderboardPrefill({
                      category: "stumped",
                      score: maxQuestions,
                      entityName: learnName || undefined,
                      domain: currentDomain,
                      difficulty
                    });
                    setShowLeaderboardModal(true);
                  }}
                >
                  Submit to Stumped Hall of Fame
                </button>
              </div>

              {latestUnlockedBadges.length > 0 && (
                <div
                  className="new-achievements-shelf"
                  onClick={() => {
                    setStatsInitialTab("achievements");
                    setShowStatsModal(true);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <span className="shelf-title">Badge Unlocked!</span>
                  <div className="shelf-badge-list">
                    {latestUnlockedBadges.map((b) => (
                      <span key={b.id} className="shelf-badge-item">
                        {b.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isDailyMode && dailyResult && (
                <div className="daily-challenge-card" style={{ margin: "1rem 0" }}>
                  <div className="daily-header-row">
                    <span className="daily-eyebrow">Daily Challenge #{dailyResult.dayNumber} Result</span>
                    {dailyStreak.currentStreak > 0 && (
                      <span className="daily-streak-badge">{dailyStreak.currentStreak} Day Streak</span>
                    )}
                  </div>
                  <p className="daily-target-desc">
                    You beat Cognitor on today's target ({dailyResult.targetName})!
                  </p>
                  <button className="daily-share-btn" onClick={handleShareDaily}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    <span>{copiedShare ? "Copied to Clipboard!" : "Share Daily Result"}</span>
                  </button>
                  {dailyData?.entity.funFact && (
                    <p className="daily-fun-fact-text">
                      <strong>Did you know?</strong> {dailyData.entity.funFact}
                    </p>
                  )}
                </div>
              )}

              {closestWrongEntity && closestWrongEntity.funFact && (
                <div className="fun-fact-card" style={{ margin: "1rem 0" }}>
                  <div className="fun-fact-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18h6"></path>
                      <path d="M10 22h4"></path>
                      <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7Z"></path>
                    </svg>
                    <span className="fun-fact-title">Did You Know? (Closest guess: {closestWrongEntity.name})</span>
                  </div>
                  <p className="fun-fact-text">{closestWrongEntity.funFact}</p>
                </div>
              )}

              {learnSubmitted ? (
                <div className="learn-success-card">
                  <p className="learn-success-text">
                    Thank you. Your entry has been recorded and will expand future deductions.
                  </p>
                  <button
                    className="akinator-btn btn-yes"
                    style={{ width: "auto", margin: "1rem auto 0" }}
                    onClick={() => startGame(currentDomain)}
                  >
                    Play Again
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLearnSubmit} className="learn-form-wrapper">
                  <div className="akinator-form-group">
                    <label className="akinator-form-label">
                      {currentDomain === "object" ? "What object were you thinking of?" : "Who were you thinking of?"}
                    </label>
                    <input
                      type="text"
                      className="akinator-input"
                      placeholder={currentDomain === "object" ? "e.g. Telescope, Smart Watch" : "e.g. Marie Curie, Alan Turing"}
                      value={learnName}
                      onChange={(e) => setLearnName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="akinator-form-group">
                    <label className="akinator-form-label">
                      A question distinguishing them from{" "}
                      <strong>{closestWrongEntity ? closestWrongEntity.name : "my closest deduction"}</strong>:
                    </label>
                    <input
                      type="text"
                      className="akinator-input"
                      placeholder={currentDomain === "object" ? "e.g. Is it used to observe stars?" : "e.g. Did they break the Enigma code?"}
                      value={learnQuestion}
                      onChange={(e) => setLearnQuestion(e.target.value)}
                      required
                    />
                  </div>

                  <div className="akinator-form-group">
                    <label className="akinator-form-label">
                      Correct answer for your selection:
                    </label>
                    <select
                      className="akinator-select"
                      value={learnAnswer}
                      onChange={(e) => setLearnAnswer(parseFloat(e.target.value))}
                    >
                      <option value={1.0}>Yes</option>
                      <option value={0.75}>Probably</option>
                      <option value={0.5}>Don't know</option>
                      <option value={0.25}>Probably not</option>
                      <option value={0.0}>No</option>
                    </select>
                  </div>

                  <div className="learn-btn-row">
                    <button type="submit" className="akinator-btn btn-yes" style={{ flex: 1 }} disabled={loading}>
                      {loading ? "Recording..." : "Submit Entity"}
                    </button>
                    <button type="button" className="sub-btn" onClick={() => startGame(currentDomain)}>
                      Skip
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>
      )}

      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        stats={userStats}
        onReset={handleResetUserStats}
        initialTab={statsInitialTab}
      />

      <ChallengeCreatorModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        onPlayChallenge={(code, dom, creator) => handlePlayChallenge(code, dom, creator)}
      />

      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        prefillSubmit={leaderboardPrefill}
      />

      <GameHistoryModal
        isOpen={showGameHistoryModal}
        onClose={() => setShowGameHistoryModal(false)}
      />

      {toastAchievement && (
        <div
          className="achievement-toast"
          onClick={() => {
            setStatsInitialTab("achievements");
            setShowStatsModal(true);
            setToastAchievement(null);
          }}
          role="alert"
        >
          <div className="achievement-toast-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="achievement-toast-body">
            <span className="achievement-toast-eyebrow">Achievement Unlocked</span>
            <span className="achievement-toast-title">{toastAchievement.title}</span>
          </div>
        </div>
      )}

      {/* DISCREET MINIMAL FOOTER */}
      <footer className="akinator-footer">
        <div className="footer-links">
          <span>Cognitor</span>
          <span>·</span>
          <span>20 Questions Mind Guesser</span>
          <span>·</span>
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              navigateToAdmin();
            }}
            className="footer-admin-link"
          >
            Admin
          </a>
        </div>
      </footer>
    </div>
  );
}
