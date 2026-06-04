'use client';

import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { track } from '@/lib/analytics/track';
import { SignInSheet } from '@/components/SignInSheet/SignInSheet';
import {
  QuizOption,
  Button,
  Badge,
  ProgressBar,
  Skeleton,
  EmptyState,
} from '@chi-digo/design-system';
import type { ChallengeQuestionPublic, ChallengeQuestionFull, CompletionAnswer } from '@/lib/challenge/types';
import styles from './ChallengePage.module.css';

// ── Types ──

type LocaleKey = 'e' | 's' | 'd';
const LOCALE_MAP: Record<string, LocaleKey> = { en: 'e', sw: 's', dig: 'd' };
const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const QUESTIONS_PER_ROUND = 10;
const AUTO_ADVANCE_MS = 1200;

interface ChallengeMetadata {
  id: string;
  short_code: string;
  challenger: { display_name: string | null; avatar_url: string | null };
  score: number;
  total: number;
  category_breakdown: Record<string, { total: number; correct: number }> | null;
  status: 'active' | 'expired';
  completions_count: number;
}

interface ChallengerResult {
  display_name: string | null;
  score: number;
  answers: Array<CompletionAnswer & { is_correct: boolean }>;
}

interface Answer {
  questionId: string;
  selectedOption: number;
  correct: boolean;
  timeMs: number;
}

type Phase =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'landing'; meta: ChallengeMetadata }
  | { type: 'playing'; qi: number; questions: ChallengeQuestionPublic[]; answers: Answer[]; startedAt: number; meta: ChallengeMetadata }
  | { type: 'answered'; qi: number; questions: ChallengeQuestionPublic[]; answers: Answer[]; selected: number; correct: boolean; startedAt: number; meta: ChallengeMetadata }
  | { type: 'submitting'; questions: ChallengeQuestionPublic[]; answers: Answer[]; meta: ChallengeMetadata }
  | { type: 'results'; questions: ChallengeQuestionFull[]; myAnswers: Answer[]; challenger: ChallengerResult; score: number; total: number; completionsCount: number; meta: ChallengeMetadata };

type Action =
  | { type: 'LOAD_META'; meta: ChallengeMetadata }
  | { type: 'ERROR'; message: string }
  | { type: 'START_PLAY'; questions: ChallengeQuestionPublic[] }
  | { type: 'SELECT_ANSWER'; optionIndex: number; correctIndex: number }
  | { type: 'NEXT_QUESTION' }
  | { type: 'SUBMITTING' }
  | { type: 'SHOW_RESULTS'; questions: ChallengeQuestionFull[]; challenger: ChallengerResult; score: number; completionsCount: number };

function reducer(state: Phase, action: Action): Phase {
  switch (action.type) {
    case 'LOAD_META':
      return { type: 'landing', meta: action.meta };
    case 'ERROR':
      return { type: 'error', message: action.message };
    case 'START_PLAY': {
      if (state.type !== 'landing') return state;
      return { type: 'playing', qi: 0, questions: action.questions, answers: [], startedAt: Date.now(), meta: state.meta };
    }
    case 'SELECT_ANSWER': {
      if (state.type !== 'playing') return state;
      const q = state.questions[state.qi];
      const correct = action.optionIndex === action.correctIndex;
      const timeMs = Date.now() - state.startedAt;
      const answer: Answer = { questionId: q.source_question_id, selectedOption: action.optionIndex, correct, timeMs };
      return { ...state, type: 'answered', selected: action.optionIndex, correct, answers: [...state.answers, answer] };
    }
    case 'NEXT_QUESTION': {
      if (state.type !== 'answered') return state;
      const nextQi = state.qi + 1;
      if (nextQi >= state.questions.length) {
        return { type: 'submitting', questions: state.questions, answers: state.answers, meta: state.meta };
      }
      return { type: 'playing', qi: nextQi, questions: state.questions, answers: state.answers, startedAt: Date.now(), meta: state.meta };
    }
    case 'SUBMITTING': {
      if (state.type !== 'answered') return state;
      return { type: 'submitting', questions: state.questions, answers: state.answers, meta: state.meta };
    }
    case 'SHOW_RESULTS': {
      if (state.type !== 'submitting') return state;
      return {
        type: 'results',
        questions: action.questions,
        myAnswers: state.answers,
        challenger: action.challenger,
        score: action.score,
        total: state.meta.total,
        completionsCount: action.completionsCount,
        meta: state.meta,
      };
    }
    default:
      return state;
  }
}

function getAnonymousId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('chidigo-anonymous-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('chidigo-anonymous-id', id);
  }
  return id;
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

// ── Component ──

export function ChallengePage({ code }: { code: string }) {
  const t = useTranslations();
  const { locale } = useLocale();
  const lk: LocaleKey = LOCALE_MAP[locale] || 'e';
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { type: 'loading' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionsAnswersRef = useRef<Record<string, number>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const categoryLabels: Record<string, string> = {
    vocabulary: t.quiz?.categories?.vocabulary ?? 'Vocabulary',
    proverbs: t.quiz?.categories?.proverbs ?? 'Proverbs',
    riddles: t.quiz?.categories?.riddles ?? 'Riddles',
  };

  // ── Load challenge metadata ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/challenges/${code}`);
        if (!res.ok) {
          dispatch({ type: 'ERROR', message: res.status === 404 ? (t.challenge?.not_found ?? 'Challenge not found') : 'Failed to load challenge' });
          return;
        }
        const meta = await res.json();
        if (!cancelled) {
          dispatch({ type: 'LOAD_META', meta });
          track('orientation', 'challenge', 'link_open', { challenge_id: meta.id });
        }
      } catch {
        if (!cancelled) dispatch({ type: 'ERROR', message: 'Failed to load challenge' });
      }
    })();
    return () => { cancelled = true; };
  }, [code, t.challenge?.not_found]);

  // ── Auto-advance after correct answer ──
  useEffect(() => {
    if (state.type === 'answered' && state.correct) {
      timerRef.current = setTimeout(() => dispatch({ type: 'NEXT_QUESTION' }), AUTO_ADVANCE_MS);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [state]);

  // ── Submit answers when all questions answered ──
  useEffect(() => {
    if (state.type !== 'submitting') return;
    let cancelled = false;

    (async () => {
      try {
        const totalTimeMs = state.answers.reduce((sum, a) => sum + a.timeMs, 0);
        const body: Record<string, unknown> = {
          answers: state.answers.map((a) => ({
            source_question_id: a.questionId,
            selected_answer_index: a.selectedOption,
            time_to_answer_ms: a.timeMs,
          })),
          time_taken_ms: totalTimeMs,
        };
        if (!user) body.anonymous_id = getAnonymousId();

        const res = await fetch(`/api/challenges/${code}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error('Failed to submit');
        const data = await res.json();
        if (!cancelled) {
          dispatch({
            type: 'SHOW_RESULTS',
            questions: data.questions,
            challenger: data.challenger,
            score: data.score,
            completionsCount: data.completions_count,
          });
          track('language', 'challenge', 'complete', {
            challenge_id: state.meta.id,
            score: data.score,
            challenger_score: data.challenger.score,
          });
        }
      } catch {
        if (!cancelled) dispatch({ type: 'ERROR', message: 'Failed to submit answers' });
      }
    })();

    return () => { cancelled = true; };
  }, [state.type, code, user]);

  // ── Handlers ──

  const handleAccept = useCallback(async () => {
    if (state.type !== 'landing') return;
    try {
      const res = await fetch(`/api/challenges/${code}/questions`);
      if (!res.ok) {
        if (res.status === 410) {
          dispatch({ type: 'ERROR', message: t.challenge?.expired ?? 'This challenge has expired' });
          return;
        }
        throw new Error('Failed to load questions');
      }
      const data = await res.json();
      const questions = data.questions as ChallengeQuestionPublic[];

      // We don't have correct answers yet — they come after submission
      // But we need them for the SELECT_ANSWER action to compute correctness
      // The complete endpoint does server-side scoring, so we can skip client scoring
      // Store a placeholder — correctness is determined server-side
      questionsAnswersRef.current = {};

      dispatch({ type: 'START_PLAY', questions });
      track('language', 'challenge', 'accept', { challenge_id: state.meta.id, is_new_user: !user });
    } catch {
      dispatch({ type: 'ERROR', message: 'Failed to load questions' });
    }
  }, [state, code, user, t.challenge?.expired]);

  const handleSelectAnswer = useCallback((optionIndex: number) => {
    // Client doesn't know correct answer — pass -1 so correct is always false client-side
    // Server-side scoring happens on submit
    dispatch({ type: 'SELECT_ANSWER', optionIndex, correctIndex: -1 });
  }, []);

  const handleContinue = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch({ type: 'NEXT_QUESTION' });
  }, []);

  // ── Render ──

  let content: React.ReactNode;

  if (state.type === 'loading') {
    content = (
      <div className={styles.container}>
        <div className={styles.loadingView}>
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} />
          <Skeleton width="100%" height={200} />
          <Skeleton width="100%" height={48} />
        </div>
        <p className={styles.loadingText}>{t.challenge?.loading ?? 'Loading challenge…'}</p>
      </div>
    );
  } else if (state.type === 'error') {
    content = (
      <div className={styles.container}>
        <EmptyState
          title={state.message}
          action={
            <Button onClick={() => window.location.reload()}>
              {t.quiz?.retry ?? 'Tap to retry'}
            </Button>
          }
        />
      </div>
    );
  } else if (state.type === 'landing') {
    const meta = state.meta;
    const challengerName = meta.challenger.display_name ?? 'Mtu wa Chidigo';

    content = (
      <div className={styles.container}>
        <div className={styles.landingCard}>
          <div className={styles.challengerInfo}>
            <div className={styles.avatar}>{challengerName[0]?.toUpperCase()}</div>
            <h1 className={styles.challengerName}>
              {(t.challenge?.challenge_by ?? 'Challenge by {name}').replace('{name}', challengerName)}
            </h1>
          </div>

          <div className={styles.scoreBadge}>
            <span className={styles.scoreNumber}>{meta.score}</span>
            <span className={styles.scoreTotal}>/{meta.total}</span>
          </div>
          <p className={styles.scoreBeatLabel}>{t.challenge?.score_to_beat ?? 'Score to beat'}</p>

          {meta.category_breakdown && (
            <div className={styles.categoryTags}>
              {Object.entries(meta.category_breakdown).map(([cat, data]) => (
                <Badge key={cat}>{(data as { total: number }).total} {categoryLabels[cat]?.toLowerCase()}</Badge>
              ))}
            </div>
          )}

          {meta.completions_count > 0 && (
            <p className={styles.completersCount}>
              {(t.challenge?.people_took ?? '{n} people have taken this challenge').replace('{n}', String(meta.completions_count))}
            </p>
          )}

          <p className={styles.explainer}>{t.challenge?.explainer ?? 'Chidigo is a free app to learn and celebrate the Digo language'}</p>

          {meta.status === 'expired' ? (
            <p className={styles.expiredNotice}>{t.challenge?.expired ?? 'This challenge has expired'}</p>
          ) : (
            <Button className={styles.acceptButton} onClick={handleAccept}>
              {t.challenge?.accept_button ?? 'Accept Challenge'}
            </Button>
          )}
        </div>
      </div>
    );
  } else if (state.type === 'playing' || state.type === 'answered') {
    const currentQ = state.questions[state.qi];
    const isAnswered = state.type === 'answered';
    const completedCount = isAnswered ? state.qi + 1 : state.qi;
    const qText = currentQ.question_text[lk];
    const opts = currentQ.options[lk];
    const challengerName = state.meta.challenger.display_name ?? 'Mtu wa Chidigo';

    content = (
      <div className={styles.container}>
        <div className={styles.challengeBanner}>
          {(t.challenge?.banner ?? 'Competing with {name}').replace('{name}', challengerName)}
        </div>

        <div className={styles.gameHeader}>
          <ProgressBar value={completedCount} max={QUESTIONS_PER_ROUND} />
          <div className={styles.questionInfo}>
            <span className={styles.questionCounter}>
              {(t.quiz?.questionOf ?? 'Question {current} of {total}')
                .replace('{current}', String(state.qi + 1))
                .replace('{total}', String(QUESTIONS_PER_ROUND))}
            </span>
            <Badge>{categoryLabels[currentQ.category]}</Badge>
          </div>
        </div>

        <div className={styles.questionCard}>
          <p className={styles.questionText}>{qText}</p>

          <div className={styles.optionsGrid}>
            {opts.map((opt, idx) => {
              let optState: 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled' = 'default';
              if (isAnswered) {
                if (idx === state.selected) {
                  optState = 'selected';
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

          {isAnswered && (
            <div className={styles.nextPanel}>
              <Button onClick={handleContinue} style={{ marginTop: 'var(--space-3)' }}>
                {state.qi + 1 < QUESTIONS_PER_ROUND
                  ? (t.quiz?.continue ?? 'Continue')
                  : (t.challenge?.submitting ?? 'Submitting answers…')}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  } else if (state.type === 'submitting') {
    content = (
      <div className={styles.container}>
        <div className={styles.loadingView}>
          <Skeleton width="100%" height={200} />
          <p className={styles.loadingText}>{t.challenge?.submitting ?? 'Submitting answers…'}</p>
        </div>
      </div>
    );
  } else if (state.type === 'results') {
    const challengerName = state.challenger.display_name ?? 'Mtu wa Chidigo';
    const iWon = state.score > state.challenger.score;
    const isDraw = state.score === state.challenger.score;

    const verdict = iWon
      ? (t.challenge?.won ?? 'You won!')
      : isDraw
        ? (t.challenge?.draw ?? "It's a draw!")
        : (t.challenge?.lost ?? '{name} won!').replace('{name}', challengerName);

    // Category breakdown
    const categories = ['vocabulary', 'proverbs', 'riddles'] as const;
    const catBreakdown = categories.map((cat) => {
      const catQuestions = state.questions.filter((q) => q.category === cat);
      if (catQuestions.length === 0) return null;
      const myCorrect = catQuestions.filter((q) => {
        const myAnswer = state.myAnswers.find((a) => a.questionId === q.source_question_id);
        return myAnswer && myAnswer.selectedOption === q.correct_answer_index;
      }).length;
      const challengerCorrect = catQuestions.filter((q) => {
        const cAnswer = state.challenger.answers.find((a) => a.source_question_id === q.source_question_id);
        return cAnswer?.is_correct;
      }).length;
      return { category: cat, label: categoryLabels[cat], total: catQuestions.length, mine: myCorrect, theirs: challengerCorrect };
    }).filter(Boolean) as Array<{ category: string; label: string; total: number; mine: number; theirs: number }>;

    content = (
      <div className={styles.container}>
        <div className={styles.resultsCard}>
          <h1 className={styles.verdict}>{verdict}</h1>

          <div className={styles.scoresRow}>
            <div className={styles.scoreColumn}>
              <span className={styles.scoreLabel}>{t.challenge?.your_score ?? 'Your score'}</span>
              <span className={styles.scoreBig}>{state.score}/{state.total}</span>
            </div>
            <span className={styles.vs}>vs</span>
            <div className={styles.scoreColumn}>
              <span className={styles.scoreLabel}>{challengerName}</span>
              <span className={styles.scoreBig}>{state.challenger.score}/{state.total}</span>
            </div>
          </div>

          <div className={styles.catBreakdown}>
            {catBreakdown.map((cb) => (
              <div key={cb.category} className={styles.catRow}>
                <Badge>{cb.label}</Badge>
                <span>You {cb.mine}/{cb.total}, {challengerName} {cb.theirs}/{cb.total}</span>
              </div>
            ))}
          </div>

          {/* Expandable per-question detail */}
          <button
            type="button"
            className={styles.detailToggle}
            onClick={() => setDetailOpen(!detailOpen)}
          >
            {t.challenge?.see_questions ?? 'See all questions'} {detailOpen ? '▲' : '▼'}
          </button>

          {detailOpen && (
            <div className={styles.questionDetail}>
              {state.questions.map((q, i) => {
                const myAnswer = state.myAnswers.find((a) => a.questionId === q.source_question_id);
                const challengerAnswer = state.challenger.answers.find((a) => a.source_question_id === q.source_question_id);
                const myCorrect = myAnswer ? myAnswer.selectedOption === q.correct_answer_index : false;
                const opts = q.options[lk];

                return (
                  <div key={q.source_question_id} className={styles.questionRow}>
                    <p className={styles.qNum}>Q{i + 1}</p>
                    <p className={styles.qText}>{q.question_text[lk]}</p>
                    <p className={styles.correctAnswer}>
                      ✓ {opts[q.correct_answer_index]}
                    </p>
                    <div className={styles.playerAnswers}>
                      <span className={myCorrect ? styles.answerCorrect : styles.answerWrong}>
                        You: {myAnswer ? opts[myAnswer.selectedOption] : '—'}
                        {myCorrect ? ' ✓' : ' –'}
                      </span>
                      <span className={challengerAnswer?.is_correct ? styles.answerCorrect : styles.answerWrong}>
                        {challengerName}: {challengerAnswer ? opts[challengerAnswer.selected_answer_index] : '—'}
                        {challengerAnswer?.is_correct ? ' ✓' : ' –'}
                      </span>
                    </div>
                    {!myCorrect && q.explanation && (
                      <p className={styles.explanation}>{q.explanation[lk]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.resultActions}>
            <Button
              onClick={() => {
                const baseUrl = window.location.origin;
                const url = `${baseUrl}/challenge/${code}`;
                const text = (t.challenge?.share_competitive ?? 'I scored {n}/{total} on the Chidigo quiz. Think you can beat me? {link}')
                  .replace('{n}', String(state.score))
                  .replace('{total}', String(state.total))
                  .replace('{link}', url);
                if (navigator.share) {
                  navigator.share({ title: 'Chidigo Quiz Challenge', text, url }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(text);
                }
              }}
            >
              {t.challenge?.challenge_button ?? 'Challenge a Friend'}
            </Button>
            <Button variant="ghost" onClick={() => { window.location.href = '/language/quiz'; }}>
              {t.challenge?.play_again ?? 'Play Again'}
            </Button>
          </div>

          {!user && (
            <div className={styles.signupPrompt}>
              <p>{t.challenge?.signup_prompt ?? 'Sign up to save your results and challenge others'}</p>
              <Button variant="ghost" onClick={() => setSheetOpen(true)}>
                {t.auth?.sign_in ?? 'Sign in'}
              </Button>
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
        onClose={() => setSheetOpen(false)}
        title={t.auth?.sign_in_to_save ?? 'Sign in to save favourites'}
      />
    </div>
  );
}
