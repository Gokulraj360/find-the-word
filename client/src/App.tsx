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
import { GameModesModal } from "./GameModesModal.js";
import { CyberAvatar } from "./CyberAvatar.js";
import { DeductionPathwayGraph } from "./DeductionPathwayGraph.js";
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
  const [showGameModesModal, setShowGameModesModal] = useState(false);
  const [showPathway, setShowPathway] = useState(false);
  const [statsInitialTab, setStatsInitialTab] = useState<"stats" | "achievements" | "history">("stats");
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
  const [agreeLearnTerms, setAgreeLearnTerms] = useState(true);

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
          {/* WELCOME / IDLE ARENA (CLEAN AKINATOR-STYLE) */}
          {/* ============================================================ */}
          {gameState === "idle" && (
            <div className="hero-akinator-stage">
              <div className="hero-mystic-emblem">
                <div className="mystic-orb-ring" />
                <div className="mystic-orb-core">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                    <path d="M2 12h20"></path>
                  </svg>
                </div>
              </div>

              <div className="hero-text-block">
                <h1 className="hero-headline">Think of anyone or anything</h1>
                <p className="hero-subline">
                  I will deduce who or what you are thinking of through a series of questions.
                </p>
              </div>

              {incomingChallenge && (
                <div className="incoming-challenge-pill">
                  <span className="incoming-pill-text">
                    Challenge from <strong>{incomingChallenge.creatorName}</strong> ({incomingChallenge.domain})!
                  </span>
                  <div className="incoming-pill-btns">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() =>
                        handlePlayChallenge(
                          incomingChallenge.code,
                          incomingChallenge.domain,
                          incomingChallenge.creatorName
                        )
                      }
                      type="button"
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setIncomingChallenge(null)}
                      type="button"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Sleek Domain Segmented Control */}
              <div className="domain-segmented-control" role="tablist">
                <button
                  type="button"
                  className={`domain-segment-btn ${currentDomain === "character" ? "domain-segment-active" : ""}`}
                  onClick={() => setCurrentDomain("character")}
                  role="tab"
                  aria-selected={currentDomain === "character"}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Characters</span>
                </button>
                <button
                  type="button"
                  className={`domain-segment-btn ${currentDomain === "object" ? "domain-segment-active" : ""}`}
                  onClick={() => setCurrentDomain("object")}
                  role="tab"
                  aria-selected={currentDomain === "object"}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  <span>Objects</span>
                </button>
              </div>

              {/* Big Iconic Play Button */}
              <button
                className="hero-play-btn"
                onClick={() => startGame(currentDomain)}
                disabled={loading}
              >
                <span>Play</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>

              {/* Compact Daily Challenge Strip */}
              {dailyData && (
                <div className="hero-daily-strip">
                  <div className="hero-daily-info">
                    <span className="daily-strip-badge">Daily #{dailyData.dayNumber}</span>
                    {dailyStreak.currentStreak > 0 && (
                      <span className="daily-strip-streak">{dailyStreak.currentStreak} Day Streak</span>
                    )}
                    <span className="daily-strip-clue">
                      {dailyResult ? `Solved in ${dailyResult.questionsCount} Qs` : `Target: "${dailyData.entity.name}"`}
                    </span>
                  </div>
                  {!dailyResult ? (
                    <button className="daily-strip-btn" onClick={startDailyGame} disabled={loading}>
                      Play Daily
                    </button>
                  ) : (
                    <button className="daily-strip-btn" onClick={handleShareDaily}>
                      Share
                    </button>
                  )}
                </div>
              )}

              {/* More Game Modes Trigger */}
              <button
                type="button"
                className="modes-sheet-trigger"
                onClick={() => setShowGameModesModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>More Game Modes · 2-Player, Role Reversal, Trivia & Friends</span>
              </button>
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
                <span className="q-step-badge">Question {currentQuestion.step}</span>
                {isDailyMode && dailyData && (
                  <span className="daily-active-tag">Daily Challenge #{dailyData.dayNumber}</span>
                )}
              </div>

              {/* Speech Bubble Stage */}
              <div className="dialogue-stage">
                {currentDialogue && (
                  <div className="cognitor-thought-strip">
                    <span className="thought-orb-dot" />
                    <p className="thought-quote">"{currentDialogue.line}"</p>
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
          {/* THE DEDUCTION CARD ("I THINK OF...") - CYBER AESTHETIC */}
          {/* ============================================================ */}
          {gameState === "guess_pending" && guess && (
            <div className="deduction-screen-wrapper">
              <h2 className="deduction-outer-title">I think of...</h2>

              <div className="arena-deduction-card cyber-glowing-card">
                <div className="deduction-header">
                  <h3 className="deduction-inner-heading">My Deduction</h3>
                  <p className="deduction-cognitor-quote">
                    "{currentDialogue ? currentDialogue.line : "All clues point toward one undeniable conclusion."}"
                  </p>
                </div>

                <div className="deduction-portrait-wrapper">
                  <CyberAvatar
                    size={115}
                    imageUrl={!imageFailed ? proxiedImageUrl : null}
                    name={guess.name}
                    ringGlow={true}
                  />
                </div>

                <div className="deduction-caption-block">
                  <h4 className="deduction-entity-name">{guess.name}</h4>
                  <p className="deduction-entity-desc">
                    {guess.description || `"All clues point toward one undeniable conclusion."`}
                  </p>
                </div>

                <div className="deduction-button-row">
                  <button
                    className="deduction-btn-confirm-yes"
                    onClick={() => confirmGuess(true)}
                    disabled={loading}
                  >
                    <span>Yes, that's it!</span>
                  </button>
                  <button
                    className="deduction-btn-confirm-no"
                    onClick={() => confirmGuess(false)}
                    disabled={loading}
                  >
                    <span>No</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* WON SCREEN (CONFIRMED DEDUCTION) - MATCHING DESIGN SPEC */}
          {/* ============================================================ */}
          {gameState === "won" && (
            <div className="arena-result-grid spec-result-card">
              <div className="deduction-confirmed-header">
                <h2 className="confirmed-main-title">Deduction Confirmed</h2>
                <p className="confirmed-sub-title">
                  - Mind Read Successfully in {currentQuestion ? currentQuestion.step : history.length} Questions
                </p>
              </div>

              {/* HOLOGRAPHIC NEW RECORD BANNER */}
              <div className="holographic-record-strip">
                <div className="record-strip-glow" />
                <div className="record-strip-content">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                    <path d="M4 22h16"></path>
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34"></path>
                    <path d="M6 4h12v7a6 6 0 0 1-12 0V4Z"></path>
                  </svg>
                  <span className="record-strip-text">New Record!</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              </div>

              {/* UNLOCKED ACHIEVEMENTS SHELF */}
              <div
                className="unlocked-achievements-shelf"
                onClick={() => {
                  setStatsInitialTab("achievements");
                  setShowStatsModal(true);
                }}
                role="button"
                tabIndex={0}
                title="View All Achievements"
              >
                <span className="shelf-section-title">Unlocked Achievements</span>
                <div className="shelf-podium">
                  <div className="shelf-badge badge-trophy" title="Novice Seeker">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                      <path d="M4 22h16"></path>
                      <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34"></path>
                      <path d="M6 4h12v7a6 6 0 0 1-12 0V4Z"></path>
                    </svg>
                  </div>
                  <div className="shelf-badge badge-gamepad" title="Gamer Dedication">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="6" y1="12" x2="10" y2="12"></line>
                      <line x1="8" y1="10" x2="8" y2="14"></line>
                      <line x1="15" y1="13" x2="15.01" y2="13"></line>
                      <line x1="18" y1="11" x2="18.01" y2="11"></line>
                      <rect x="2" y="6" width="20" height="12" rx="6"></rect>
                    </svg>
                  </div>
                  <div className="shelf-badge badge-ribbon" title="Master Deductive Mind">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6"></circle>
                      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                    </svg>
                  </div>
                  <div className="shelf-badge badge-shield" title="Shield Intuition">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div className="shelf-badge badge-lock" title="Locked Tier">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* DID YOU KNOW? CARD */}
              <div className="cyber-funfact-card">
                <div className="cyber-funfact-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div className="cyber-funfact-body">
                  <h4 className="cyber-funfact-title">Did You Know?</h4>
                  <p className="cyber-funfact-desc">
                    {guess?.funFact || "Trivia fun fact is mysterious deduction character."}
                  </p>
                </div>
              </div>

              {/* DEDUCTION PATHWAY HORIZONTAL GRAPH */}
              <DeductionPathwayGraph
                history={history}
                targetName={guess ? guess.name : "Deduction Target"}
              />

              {/* PLAY AGAIN GRADIENT BUTTON */}
              <div className="result-action-center">
                <button
                  className="btn-play-again-gradient"
                  onClick={() => startGame(currentDomain)}
                >
                  Play Again
                </button>
              </div>

              {/* SECONDARY ACTION STRIP */}
              <div className="result-secondary-strip">
                <button
                  className="secondary-strip-btn"
                  onClick={() => startGame(currentDomain === "object" ? "character" : "object")}
                >
                  Switch to {currentDomain === "object" ? "Characters" : "Objects"}
                </button>
                <button
                  className="secondary-strip-btn"
                  onClick={() => {
                    const questionsUsed = currentQuestion ? currentQuestion.step : history.length;
                    setLeaderboardPrefill({
                      category: isDailyMode ? "daily" : "fastest_guess",
                      score: questionsUsed,
                      entityName: guess?.name,
                      domain: currentDomain,
                      difficulty
                    });
                    setShowLeaderboardModal(true);
                  }}
                >
                  Submit to Leaderboard
                </button>
                <button
                  className="secondary-strip-btn"
                  onClick={() => {
                    setStatsInitialTab("history");
                    setShowStatsModal(true);
                  }}
                >
                  Match History
                </button>
              </div>

              {/* OPTIONAL QUESTION BREAKDOWN ACCORDION */}
              {history.length > 0 && (
                <div className="pathway-accordion-wrap">
                  <button
                    className="pathway-toggle-btn"
                    onClick={() => setShowPathway(!showPathway)}
                    type="button"
                  >
                    <span>{showPathway ? "Hide Question Breakdown" : `View Full Question Trail (${history.length} Questions)`}</span>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: showPathway ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.15s ease"
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  {showPathway && (
                    <div className="arena-result-pathway-card">
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
            </div>
          )}

          {/* ============================================================ */}
          {/* LOST SCREEN (STUMPED / DEFEATED) - MATCHING DESIGN SPEC */}
          {/* ============================================================ */}
          {gameState === "lost" && (
            <div className="arena-result-card spec-defeat-card">
              {/* DEFEAT HEADER & CONFETTI ACCENTS */}
              <div className="defeat-header-container">
                <div className="defeat-confetti-piece c1" />
                <div className="defeat-confetti-piece c2" />
                <div className="defeat-confetti-piece c3" />
                <div className="defeat-confetti-piece c4" />
                <div className="defeat-confetti-piece c5" />
                <div className="defeat-confetti-piece c6" />
                <h2 className="defeat-main-title">You Defeated Me!</h2>
                <h3 className="defeat-giveup-title">I Give Up</h3>
              </div>

              {/* CARD 1: CLOSEST GUESS */}
              <div className="closest-guess-cyber-card">
                <CyberAvatar
                  size={64}
                  imageUrl={null}
                  name={closestWrongEntity ? closestWrongEntity.name : "Closest Guess"}
                  ringGlow={true}
                />
                <div className="closest-guess-meta">
                  <h4 className="closest-guess-title">Closest Guess</h4>
                  <p className="closest-guess-desc">
                    {closestWrongEntity
                      ? `${closestWrongEntity.name} - ${closestWrongEntity.description || "A near-miss entity for a mysterious cyber/human character."}`
                      : "A near-miss entity for a mysterious cyber/human character."}
                  </p>
                </div>
              </div>

              {/* CARD 2: CROWDSOURCED LEARNING FORM */}
              {learnSubmitted ? (
                <div className="learn-success-card">
                  <p className="learn-success-text">
                    Thank you. Your entity submission has been queued and will sharpen future deductions!
                  </p>
                  <button
                    className="btn-cyan-glow"
                    style={{ margin: "1rem auto 0", display: "inline-block" }}
                    onClick={() => startGame(currentDomain)}
                  >
                    Play Again
                  </button>
                </div>
              ) : (
                <div className="crowdsourced-form-card">
                  <h4 className="crowdsourced-title">Crowdsourced Learning Form</h4>
                  <p className="crowdsourced-sub">
                    {currentDomain === "object" ? "Teach Cognitor the object you were thinking of" : "Teach Cognitor who you were thinking of"}
                  </p>

                  <form onSubmit={handleLearnSubmit} className="cyber-learn-form">
                    <div className="form-group-cyber">
                      <label className="cyber-field-label">Entity Name</label>
                      <input
                        type="text"
                        className="cyber-input"
                        placeholder={currentDomain === "object" ? "e.g. Telescope, Smart Watch..." : "e.g. Marie Curie, Alan Turing..."}
                        value={learnName}
                        onChange={(e) => setLearnName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group-cyber">
                      <label className="cyber-field-label">
                        Distinctive Clue distinguishing from {closestWrongEntity ? closestWrongEntity.name : "closest deduction"}
                      </label>
                      <input
                        type="text"
                        className="cyber-input"
                        placeholder={currentDomain === "object" ? "e.g. Is it used to observe stars?" : "e.g. Did they break the Enigma code?"}
                        value={learnQuestion}
                        onChange={(e) => setLearnQuestion(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group-cyber">
                      <label className="cyber-field-label">Correct answer for your selection</label>
                      <select
                        className="cyber-select"
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

                    <label className="cyber-checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreeLearnTerms}
                        onChange={(e) => setAgreeLearnTerms(e.target.checked)}
                        className="cyber-checkbox-native"
                      />
                      <span className="cyber-checkbox-custom" />
                      <span className="cyber-checkbox-text">
                        I agree to submit this entity to the crowdsourced learning review queue.
                      </span>
                    </label>

                    <div className="cyber-learn-actions">
                      <button
                        type="submit"
                        className="btn-cyan-glow submit-entity-btn"
                        disabled={loading || !agreeLearnTerms}
                      >
                        {loading ? "Recording..." : "Submit Entity"}
                      </button>
                      <button
                        type="button"
                        className="btn-dark-outline"
                        onClick={() => startGame(currentDomain)}
                      >
                        Skip & Play Again
                      </button>
                    </div>
                  </form>
                </div>
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

      <GameModesModal
        isOpen={showGameModesModal}
        onClose={() => setShowGameModesModal(false)}
        dailyData={dailyData}
        dailyResult={dailyResult}
        dailyStreak={dailyStreak}
        onPlayDaily={startDailyGame}
        onStartTwoPlayer={() => setIsTwoPlayerMode(true)}
        onStartQuiz={(dom) => {
          setQuizDomain(dom);
          setIsQuizMode(true);
        }}
        onStartReversal={(dom) => {
          setReverseDomain(dom);
          setIsReverseMode(true);
        }}
        onCreateChallenge={() => setShowChallengeModal(true)}
        onPlayChallengeCode={(code) => handlePlayChallenge(code, "character", "Friend")}
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
