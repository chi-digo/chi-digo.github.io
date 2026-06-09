'use client';

import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { track } from '@/lib/analytics/track';
import { SignInSheet } from '@/components/SignInSheet/SignInSheet';
import {
  QuizOption,
  ScoreCard,
  Confetti,
  Button,
  Badge,
  ProgressBar,
  Skeleton,
  EmptyState,
  Toast,
} from '@chi-digo/design-system';
import { useShareCard } from '@/hooks/useShareCard';
import styles from './QuizPage.module.css';

// ── Types ──

type TriText = { e: string; s: string; d: string };

interface Question {
  id: string;
  q: TriText;
  opts: { e: string[]; s: string[]; d: string[] };
  ans: number;
  exp: TriText;
  cat: 'vocabulary' | 'proverbs' | 'riddles';
  dif: 'easy' | 'medium' | 'hard';
}

interface QuizBank {
  version: string;
  questions: {
    vocabulary: { easy: Question[]; medium: Question[]; hard: Question[] };
    proverbs: { easy: Question[]; medium: Question[]; hard: Question[] };
    riddles: { easy: Question[]; medium: Question[]; hard: Question[] };
  };
  meta: {
    totalQuestions: number;
    counts: Record<string, Record<string, number>>;
  };
}

interface Answer {
  questionId: string;
  selectedOption: number;
  correct: boolean;
  timeMs: number;
}

type LocaleKey = 'e' | 's' | 'd';

const LOCALE_MAP: Record<string, LocaleKey> = { en: 'e', sw: 's', dig: 'd' };

type GamePhase =
  | { type: 'loading'; progress: number }
  | { type: 'error'; message: string }
  | { type: 'playing'; qi: number; questions: Question[]; answers: Answer[]; startedAt: number }
  | { type: 'answered'; qi: number; questions: Question[]; answers: Answer[]; selected: number; correct: boolean }
  | { type: 'results'; questions: Question[]; answers: Answer[]; score: number };

type GameAction =
  | { type: 'LOAD_PROGRESS'; progress: number }
  | { type: 'LOAD_SUCCESS'; bank: QuizBank }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'SELECT_ANSWER'; optionIndex: number }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RESTART'; bank: QuizBank };

const QUESTIONS_PER_ROUND = 10;
const AUTO_ADVANCE_MS = 1200;

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// ── Question Selection ──

function selectQuestions(bank: QuizBank, roundNumber: number): Question[] {
  const cats: Array<'vocabulary' | 'proverbs' | 'riddles'> = ['vocabulary', 'proverbs', 'riddles'];
  const splits = [
    [4, 3, 3],
    [3, 4, 3],
    [3, 3, 4],
  ];
  const catCounts = splits[roundNumber % 3];

  const recentScores = getRecentScores();
  const diffSplit = getDifficultySplit(recentScores);
  const answeredIds = getAnsweredIds();

  const selected: Question[] = [];

  for (let ci = 0; ci < cats.length; ci++) {
    const cat = cats[ci];
    const count = catCounts[ci];
    const pool = bank.questions[cat];

    const catQuestions: Question[] = [];
    for (const dif of ['easy', 'medium', 'hard'] as const) {
      const available = pool[dif].filter((q) => !answeredIds.has(q.id));
      const needed = Math.round((diffSplit[dif] / QUESTIONS_PER_ROUND) * count);
      catQuestions.push(...shuffle(available).slice(0, Math.max(needed, 1)));
    }

    selected.push(...shuffle(catQuestions).slice(0, count));
  }

  while (selected.length < QUESTIONS_PER_ROUND) {
    const allPool = [
      ...bank.questions.vocabulary.medium,
      ...bank.questions.proverbs.medium,
      ...bank.questions.riddles.medium,
    ].filter((q) => !answeredIds.has(q.id) && !selected.some((s) => s.id === q.id));
    if (allPool.length === 0) break;
    selected.push(allPool[Math.floor(Math.random() * allPool.length)]);
  }

  return shuffle(selected).slice(0, QUESTIONS_PER_ROUND);
}

function getDifficultySplit(scores: number[]): Record<string, number> {
  if (scores.length >= 2 && scores.slice(-2).every((s) => s >= 9)) {
    return { easy: 2, medium: 4, hard: 4 };
  }
  if (scores.length >= 2 && scores.slice(-2).every((s) => s <= 4)) {
    return { easy: 4, medium: 4, hard: 2 };
  }
  return { easy: 3, medium: 4, hard: 3 };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Session Storage ──

function getRecentScores(): number[] {
  try {
    return JSON.parse(sessionStorage.getItem('quiz-scores') || '[]');
  } catch {
    return [];
  }
}

function saveScore(score: number) {
  try {
    const scores = getRecentScores();
    scores.push(score);
    sessionStorage.setItem('quiz-scores', JSON.stringify(scores.slice(-5)));
  } catch {}
}

function getAnsweredIds(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem('quiz-answered') || '[]'));
  } catch {
    return new Set();
  }
}

function saveAnsweredIds(ids: string[]) {
  try {
    const existing = getAnsweredIds();
    ids.forEach((id) => existing.add(id));
    sessionStorage.setItem('quiz-answered', JSON.stringify([...existing]));
  } catch {}
}

function getRoundNumber(): number {
  try {
    return parseInt(sessionStorage.getItem('quiz-round') || '0', 10);
  } catch {
    return 0;
  }
}

function incrementRound() {
  try {
    sessionStorage.setItem('quiz-round', String(getRoundNumber() + 1));
  } catch {}
}

function hasFreeRoundBeenPlayed(): boolean {
  try {
    return sessionStorage.getItem('quiz_free_round_played') === 'true';
  } catch {
    return false;
  }
}

function markFreeRoundPlayed() {
  try {
    sessionStorage.setItem('quiz_free_round_played', 'true');
  } catch {}
}

function buildRoundPayload(
  questions: Question[],
  answers: Answer[],
  score: number,
  totalTimeMs: number,
  lk: LocaleKey,
) {
  const diffCounts: Record<string, number> = {};
  const catBreakdown: Record<string, { correct: number; total: number }> = {};

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    diffCounts[q.dif] = (diffCounts[q.dif] || 0) + 1;
    if (!catBreakdown[q.cat]) catBreakdown[q.cat] = { correct: 0, total: 0 };
    catBreakdown[q.cat].total++;
    if (answers[i]?.correct) catBreakdown[q.cat].correct++;
  }

  return {
    score,
    total: QUESTIONS_PER_ROUND,
    time_taken_ms: totalTimeMs,
    difficulty_distribution: diffCounts,
    category_breakdown: catBreakdown,
    answers: questions.map((q, i) => ({
      question_index: i,
      question_id: q.id,
      category: q.cat,
      difficulty: q.dif,
      question_text: q.q[lk],
      options: q.opts[lk].map((text, idx) => ({ id: String(idx), text })),
      selected_option_id: String(answers[i]?.selectedOption ?? 0),
      correct_option_id: String(q.ans),
      is_correct: answers[i]?.correct ?? false,
      time_to_answer_ms: answers[i]?.timeMs ?? 0,
      explanation: q.exp[lk],
    })),
  };
}

async function saveRoundToApi(payload: ReturnType<typeof buildRoundPayload>): Promise<{ ok: boolean; roundId?: string }> {
  try {
    const res = await fetch('/api/quiz/rounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, roundId: data.id };
  } catch {
    return { ok: false };
  }
}

async function migrateLocalScore() {
  try {
    const raw = localStorage.getItem('chidigo_last_quiz_score');
    if (!raw) return;
    const payload = JSON.parse(raw);
    const res = await fetch('/api/quiz/rounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      localStorage.removeItem('chidigo_last_quiz_score');
    }
  } catch {}
}

// ── Reducer ──

function reducer(state: GamePhase, action: GameAction): GamePhase {
  switch (action.type) {
    case 'LOAD_PROGRESS':
      return { type: 'loading', progress: action.progress };

    case 'LOAD_SUCCESS': {
      const round = getRoundNumber();
      const questions = selectQuestions(action.bank, round);
      return {
        type: 'playing',
        qi: 0,
        questions,
        answers: [],
        startedAt: Date.now(),
      };
    }

    case 'LOAD_ERROR':
      return { type: 'error', message: action.message };

    case 'SELECT_ANSWER': {
      if (state.type !== 'playing') return state;
      const q = state.questions[state.qi];
      const correct = action.optionIndex === q.ans;
      const timeMs = Date.now() - state.startedAt;
      const answer: Answer = {
        questionId: q.id,
        selectedOption: action.optionIndex,
        correct,
        timeMs,
      };
      return {
        type: 'answered',
        qi: state.qi,
        questions: state.questions,
        answers: [...state.answers, answer],
        selected: action.optionIndex,
        correct,
      };
    }

    case 'NEXT_QUESTION': {
      if (state.type !== 'answered') return state;
      const nextQi = state.qi + 1;
      if (nextQi >= state.questions.length) {
        const score = state.answers.filter((a) => a.correct).length;
        saveScore(score);
        saveAnsweredIds(state.answers.map((a) => a.questionId));
        incrementRound();
        return {
          type: 'results',
          questions: state.questions,
          answers: state.answers,
          score,
        };
      }
      return {
        type: 'playing',
        qi: nextQi,
        questions: state.questions,
        answers: state.answers,
        startedAt: Date.now(),
      };
    }

    case 'RESTART': {
      const round = getRoundNumber();
      const questions = selectQuestions(action.bank, round);
      return {
        type: 'playing',
        qi: 0,
        questions,
        answers: [],
        startedAt: Date.now(),
      };
    }

    default:
      return state;
  }
}

// ── Proverbs for loading screen ──

const LOADING_PROVERBS = [
  'Achili ni nyere, chila mmwenga ana zakpwe',
  'Muhi mmwenga tauhenda tsaka',
  'Mbuzi wa chongo arichaye mwewe ni koroboi',
  'Uchizi wa pwani si uchizi wa bara',
  'Mwenye kuishi maishani lazima ajifunze',
];

// ── Icons ──

function ChallengeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ── Component ──

export function QuizPage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const lk: LocaleKey = LOCALE_MAP[locale] || 'e';
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { type: 'loading', progress: 0 });
  const bankRef = useRef<QuizBank | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameStartRef = useRef<number>(0);
  const { shareQuizScore, isGenerating } = useShareCard();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTitle, setSheetTitle] = useState<string | undefined>(undefined);
  const roundIdRef = useRef<string | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);

  useEffect(() => {
    if (user) migrateLocalScore();
  }, [user]);

  const categoryLabels: Record<string, string> = {
    vocabulary: t.quiz?.categories?.vocabulary ?? 'Vocabulary',
    proverbs: t.quiz?.categories?.proverbs ?? 'Proverbs',
    riddles: t.quiz?.categories?.riddles ?? 'Riddles',
  };

  const loadData = useCallback(async (signal: AbortSignal) => {
    try {
      dispatch({ type: 'LOAD_PROGRESS', progress: 20 });
      const res = await fetch('/data/quiz/quiz-bank.json', { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      dispatch({ type: 'LOAD_PROGRESS', progress: 60 });
      const data: QuizBank = await res.json();
      if (signal.aborted) return;
      bankRef.current = data;
      dispatch({ type: 'LOAD_SUCCESS', bank: data });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('[Quiz] Load error:', err);
      dispatch({ type: 'LOAD_ERROR', message: err instanceof Error ? err.message : 'Failed to load quiz data' });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    if (state.type === 'answered' && state.correct) {
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'NEXT_QUESTION' });
      }, AUTO_ADVANCE_MS);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [state]);

  useEffect(() => {
    if (state.type === 'playing' && state.qi === 0 && state.answers.length === 0) {
      gameStartRef.current = Date.now();
      track('language', 'quiz', 'start', { round_number: getRoundNumber() });
    }
  }, [state]);

  useEffect(() => {
    if (state.type === 'answered') {
      const q = state.questions[state.qi];
      const lastAnswer = state.answers[state.answers.length - 1];
      track('language', 'quiz', 'answer', {
        question_id: q.id,
        category: q.cat,
        difficulty: q.dif,
        correct: state.correct,
        time_to_answer_ms: lastAnswer?.timeMs || 0,
      });
    }
  }, [state]);

  useEffect(() => {
    if (state.type === 'results') {
      const totalTimeMs = Date.now() - gameStartRef.current;
      track('language', 'quiz', 'complete', {
        score: state.score,
        total: QUESTIONS_PER_ROUND,
        round_number: getRoundNumber() - 1,
        time_total_ms: totalTimeMs,
      });

      const payload = buildRoundPayload(state.questions, state.answers, state.score, totalTimeMs, lk);

      if (user) {
        savePromiseRef.current = saveRoundToApi(payload).then((result) => {
          if (result.ok) {
            roundIdRef.current = result.roundId ?? null;
            track('language', 'quiz', 'score_saved', { score: state.score, round_number: getRoundNumber() - 1 });
          } else {
            track('language', 'quiz', 'score_save_failed', { score: state.score, round_number: getRoundNumber() - 1 });
          }
        });
      } else {
        markFreeRoundPlayed();
        try {
          localStorage.setItem('chidigo_last_quiz_score', JSON.stringify(payload));
        } catch {}
      }
    }
  }, [state, user, lk]);

  const handleSelectAnswer = useCallback((idx: number) => {
    dispatch({ type: 'SELECT_ANSWER', optionIndex: idx });
  }, []);

  const handleContinue = useCallback(() => {
    track('language', 'quiz', 'continue', {});
    dispatch({ type: 'NEXT_QUESTION' });
  }, []);

  const handleChallenge = useCallback(async () => {
    if (!user) {
      track('language', 'quiz', 'sign_in_sheet_open', { source: 'challenge_friend' });
      setSheetTitle(t.auth?.sign_in_to_challenge ?? 'Sign in to challenge a friend');
      setSheetOpen(true);
      return;
    }
    setChallengeLoading(true);
    setChallengeError(null);
    if (!roundIdRef.current && savePromiseRef.current) {
      await savePromiseRef.current;
    }
    if (!roundIdRef.current) {
      setChallengeLoading(false);
      setChallengeError('Round not saved — please try again');
      track('language', 'quiz', 'challenge_create_failed', { reason: 'no_round_id' });
      return;
    }
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_id: roundIdRef.current }),
      });
      if (!res.ok) throw new Error('Failed to create challenge');
      const challenge = await res.json();
      const shareMethod = typeof navigator.share === 'function' ? 'native_share' : 'clipboard';
      track('language', 'challenge', 'create', {
        challenge_id: challenge.id,
        round_id: roundIdRef.current ?? '',
        share_method: shareMethod,
        message_tone: 'competitive',
      });
      const text = (t.challenge?.share_competitive ?? 'I scored {n}/{total} on the Chidigo quiz. Think you can beat me? {link}')
        .replace('{n}', String(challenge.score))
        .replace('{total}', String(challenge.total))
        .replace('{link}', challenge.url);
      if (navigator.share) {
        await navigator.share({ title: 'Chidigo Quiz Challenge', text, url: challenge.url }).catch(() => {});
      } else {
        await navigator.clipboard?.writeText(text);
      }
    } catch {
      setChallengeError('Failed to create challenge');
      track('language', 'quiz', 'challenge_create_failed', { reason: 'api_error' });
    } finally {
      setChallengeLoading(false);
    }
  }, [user, t.challenge?.share_competitive]);

  const handleRestart = useCallback(() => {
    if (!bankRef.current) return;
    if (!user && hasFreeRoundBeenPlayed()) {
      track('language', 'quiz', 'sign_in_sheet_open', { source: 'play_again' });
      setSheetOpen(true);
      return;
    }
    if (!user) markFreeRoundPlayed();
    track('language', 'quiz', 'restart', {
      previous_score: state.type === 'results' ? state.score : 0,
    });
    dispatch({ type: 'RESTART', bank: bankRef.current });
  }, [state, user]);

  const handleRetry = useCallback(() => {
    track('language', 'quiz', 'retry', {});
    dispatch({ type: 'LOAD_PROGRESS', progress: 0 });
    const controller = new AbortController();
    loadData(controller.signal);
  }, [loadData]);

  // ── Render inner content by phase ──

  let content: React.ReactNode;

  if (state.type === 'loading') {
    content = (
      <div className={styles.container}>
        <div className={styles.loadingView}>
          <div className={styles.skeletonQuiz}>
            <Skeleton width="100%" height={8} />
            <div className={styles.skeletonQuizHeader}>
              <Skeleton width={140} height={14} />
              <Skeleton width={72} height={22} />
            </div>
            <div className={styles.skeletonQuizCard}>
              <Skeleton width="90%" height={16} />
              <Skeleton width="65%" height={16} />
              <div className={styles.skeletonQuizOptions}>
                <Skeleton variant="rectangular" width="100%" height={52} />
                <Skeleton variant="rectangular" width="100%" height={52} />
                <Skeleton variant="rectangular" width="100%" height={52} />
                <Skeleton variant="rectangular" width="100%" height={52} />
              </div>
            </div>
          </div>
          <ProgressBar value={state.progress} max={100} />
          <p className={styles.loadingText}>
            {state.progress > 0
              ? (t.quiz?.loadingProgress ?? `Loading quiz data (${state.progress}%)`)
                  .replace('{progress}', String(state.progress))
              : (t.quiz?.loading ?? 'Preparing your quiz...')}
          </p>
          <p className={styles.proverbText} lang="dig">
            <em>{LOADING_PROVERBS[Math.floor(Date.now() / 5000) % LOADING_PROVERBS.length]}</em>
          </p>
        </div>
      </div>
    );
  } else if (state.type === 'error') {
    content = (
      <div className={styles.container}>
        <EmptyState
          title={t.quiz?.loadError ?? 'Could not load quiz data'}
          description={state.message}
          action={
            <Button onClick={handleRetry}>
              {t.quiz?.retry ?? 'Tap to retry'}
            </Button>
          }
        />
      </div>
    );
  } else if (state.type === 'results') {
    const breakdown = (['vocabulary', 'proverbs', 'riddles'] as const).map((cat) => {
      const catQs = state.questions.filter((q) => q.cat === cat);
      const catCorrect = state.answers.filter((a, i) => state.questions[i].cat === cat && a.correct).length;
      return { category: categoryLabels[cat], correct: catCorrect, total: catQs.length };
    }).filter((b) => b.total > 0);

    const message =
      state.score === QUESTIONS_PER_ROUND
        ? (t.quiz?.results?.perfect ?? "Perfect score! You're a Digo master!")
        : state.score >= 8
          ? (t.quiz?.results?.great ?? 'Great job!')
          : state.score >= 5
            ? (t.quiz?.results?.good ?? 'Good effort!')
            : (t.quiz?.results?.tryAgain ?? 'Keep practicing!');

    content = (
      <div className={styles.container}>
        <Confetti fire={state.score === QUESTIONS_PER_ROUND} />
        <ScoreCard
          score={state.score}
          total={QUESTIONS_PER_ROUND}
          breakdown={breakdown}
          message={message}
          className={styles.scoreCard}
          style={{ width: '100%' }}
          actions={
            <>
              <Button
                disabled={challengeLoading}
                onClick={handleChallenge}
                iconLeft={<ChallengeIcon />}
              >
                {challengeLoading
                  ? '…'
                  : (t.challenge?.challenge_button ?? 'Challenge a Friend')}
              </Button>
              {challengeError && <Toast message={challengeError} variant="error" onDismiss={() => setChallengeError(null)} />}
              <Button
                className={styles.shareButton}
                disabled={isGenerating}
                onClick={() => { track('language', 'quiz', 'share_click', { score: state.score, total: QUESTIONS_PER_ROUND }); shareQuizScore({ score: state.score, total: QUESTIONS_PER_ROUND, message, breakdown }); }}
                iconLeft={<ShareIcon />}
              >
                {isGenerating
                  ? (t.quiz?.results?.sharing ?? 'Sharing...')
                  : (t.quiz?.results?.share ?? 'Share Score')}
              </Button>
              <Button onClick={handleRestart} iconLeft={<ReplayIcon />}>
                {t.quiz?.results?.playAgain ?? 'Play Again'}
              </Button>
              <Button variant="ghost" onClick={() => { track('language', 'quiz', 'back_to_tools', { score: state.score }); window.history.back(); }} iconLeft={<BackIcon />}>
                {t.quiz?.results?.backToTools ?? 'Back to Tools'}
              </Button>
            </>
          }
        />
      </div>
    );
  } else {
    const currentQ = state.questions[state.qi];
    const isAnswered = state.type === 'answered';
    const completedCount = isAnswered ? state.qi + 1 : state.qi;
    const qText = currentQ.q[lk];
    const opts = currentQ.opts[lk];
    const expText = currentQ.exp[lk];

    content = (
      <div className={styles.container}>
        <div className={styles.gameHeader}>
          <ProgressBar value={completedCount} max={QUESTIONS_PER_ROUND} />
          <div className={styles.questionInfo}>
            <span className={styles.questionCounter}>
              {(t.quiz?.questionOf ?? 'Question {current} of {total}')
                .replace('{current}', String(state.qi + 1))
                .replace('{total}', String(QUESTIONS_PER_ROUND))}
            </span>
            <Badge>{categoryLabels[currentQ.cat]}</Badge>
          </div>
        </div>

        <div className={styles.questionCard}>
          <p className={styles.questionText}>{qText}</p>

          <div className={styles.optionsGrid}>
            {opts.map((opt, idx) => {
              let optState: 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled' = 'default';

              if (isAnswered) {
                if (idx === currentQ.ans) {
                  optState = 'correct';
                } else if (idx === state.selected) {
                  optState = 'incorrect';
                } else {
                  optState = 'disabled';
                }
              }

              return (
                <QuizOption
                  key={idx}
                  label={OPTION_LABELS[idx]}
                  text={opt}
                  state={optState}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={isAnswered}
                />
              );
            })}
          </div>

          {isAnswered && !state.correct && (
            <div className={styles.explanationPanel}>
              <p className={styles.explanationLabel}>
                {t.quiz?.explanation ?? 'The answer is:'}
              </p>
              <p className={styles.explanationText}>{expText}</p>
              <Button onClick={handleContinue} style={{ marginTop: 'var(--space-3)' }}>
                {t.quiz?.continue ?? 'Continue'}
              </Button>
            </div>
          )}

          {isAnswered && state.correct && (
            <div className={styles.correctFeedback}>
              <p className={styles.correctLabel}>
                {t.quiz?.correct ?? 'Correct!'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {content}
      </main>
      <SignInSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSheetTitle(undefined); }}
        title={sheetTitle ?? t.auth?.sign_in_to_play ?? 'Sign in to keep playing'}
      />
    </div>
  );
}
