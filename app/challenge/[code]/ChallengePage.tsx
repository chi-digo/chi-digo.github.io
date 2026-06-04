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
import type { ChallengeQuestionFull, CompletionAnswer } from '@/lib/challenge/types';
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
  difficulty_distribution: Record<string, number> | null;
  time_taken_ms: number | null;
  status: 'active' | 'expired';
  completions_count: number;
}

interface ChallengerResult {
  display_name: string | null;
  avatar_url?: string | null;
  score: number;
  time_taken_ms: number | null;
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
  | { type: 'playing'; qi: number; questions: ChallengeQuestionFull[]; answers: Answer[]; startedAt: number; meta: ChallengeMetadata }
  | { type: 'answered'; qi: number; questions: ChallengeQuestionFull[]; answers: Answer[]; selected: number; correct: boolean; startedAt: number; meta: ChallengeMetadata }
  | { type: 'submitting'; questions: ChallengeQuestionFull[]; answers: Answer[]; meta: ChallengeMetadata }
  | { type: 'results'; questions: ChallengeQuestionFull[]; myAnswers: Answer[]; myTimeTakenMs: number; challenger: ChallengerResult; score: number; total: number; completionsCount: number; meta: ChallengeMetadata };

type Action =
  | { type: 'LOAD_META'; meta: ChallengeMetadata }
  | { type: 'ERROR'; message: string }
  | { type: 'START_PLAY'; questions: ChallengeQuestionFull[] }
  | { type: 'SELECT_ANSWER'; optionIndex: number }
  | { type: 'NEXT_QUESTION' }
  | { type: 'SUBMITTING' }
  | { type: 'SHOW_RESULTS'; questions: ChallengeQuestionFull[]; challenger: ChallengerResult; score: number; myTimeTakenMs: number; completionsCount: number };

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
      const correct = action.optionIndex === q.correct_answer_index;
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
        myTimeTakenMs: action.myTimeTakenMs,
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

function firstName(name: string): string {
  return name.split(/\s+/)[0];
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [shareTone, setShareTone] = useState<'competitive' | 'collaborative'>('competitive');

  const categoryLabels: Record<string, string> = {
    vocabulary: t.quiz?.categories?.vocabulary ?? 'Vocabulary',
    proverbs: t.quiz?.categories?.proverbs ?? 'Proverbs',
    riddles: t.quiz?.categories?.riddles ?? 'Riddles',
  };

  const difficultyLabels: Record<string, string> = {
    easy: t.quiz?.difficulty?.easy ?? 'Easy',
    medium: t.quiz?.difficulty?.medium ?? 'Medium',
    hard: t.quiz?.difficulty?.hard ?? 'Hard',
  };

  const prevUserRef = useRef(user);
  useEffect(() => {
    if (!prevUserRef.current && user && state.type === 'results') {
      track('language', 'challenge', 'signup_prompt', { challenge_id: state.meta.id, result: 'signed_up' });
    }
    prevUserRef.current = user;
  }, [user, state]);

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
          track('language', 'challenge', 'link_open', {
            challenge_id: meta.id,
            referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct',
          });
        }
      } catch {
        if (!cancelled) dispatch({ type: 'ERROR', message: 'Failed to load challenge' });
      }
    })();
    return () => { cancelled = true; };
  }, [code, t.challenge?.not_found]);

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
            myTimeTakenMs: totalTimeMs,
            completionsCount: data.completions_count,
          });
          track('language', 'challenge', 'complete', {
            challenge_id: state.meta.id,
            challengee_score: data.score,
            challenger_score: data.challenger.score,
            time_delta: data.challenger.time_taken_ms != null ? totalTimeMs - data.challenger.time_taken_ms : 0,
            completer_number: data.completions_count,
          });
          track('language', 'challenge', 'comparison_view', {
            challenge_id: state.meta.id,
            viewer_role: user ? 'challengee' : 'anonymous',
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
      const questions = data.questions as ChallengeQuestionFull[];
      dispatch({ type: 'START_PLAY', questions });
      track('language', 'challenge', 'accept', {
        challenge_id: state.meta.id,
        is_new_user: !user,
        completer_number: state.meta.completions_count + 1,
      });
    } catch {
      dispatch({ type: 'ERROR', message: 'Failed to load questions' });
    }
  }, [state, code, user, t.challenge?.expired]);

  const handleSelectAnswer = useCallback((optionIndex: number) => {
    dispatch({ type: 'SELECT_ANSWER', optionIndex });
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
    const challengerName = firstName(meta.challenger.display_name ?? 'Mtu wa Chidigo');

    content = (
      <div className={styles.container}>
        <div className={styles.landingCard}>
          <div className={styles.challengerInfo}>
            {meta.challenger.avatar_url ? (
              <img src={meta.challenger.avatar_url} alt="" className={styles.avatarImg} referrerPolicy="no-referrer" />
            ) : (
              <div className={styles.avatar}>{challengerName[0]?.toUpperCase()}</div>
            )}
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

          {meta.difficulty_distribution && (
            <div className={styles.categoryTags}>
              {Object.entries(meta.difficulty_distribution).map(([dif, count]) => (
                <Badge key={dif}>{count} {difficultyLabels[dif]?.toLowerCase()}</Badge>
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
    const expText = currentQ.explanation?.[lk] ?? '';
    const challengerName = firstName(state.meta.challenger.display_name ?? 'Mtu wa Chidigo');

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
                if (idx === currentQ.correct_answer_index) {
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
    const challengerName = firstName(state.challenger.display_name ?? 'Mtu wa Chidigo');
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

          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th />
                <th>{t.challenge?.you ?? 'You'}</th>
                <th>{challengerName}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.rowLabel}>{t.challenge?.score_label ?? 'Score'}</td>
                <td className={styles.cellValue}>{state.score}/{state.total}</td>
                <td className={styles.cellValue}>{state.challenger.score}/{state.total}</td>
              </tr>
              {(state.myTimeTakenMs > 0 || state.challenger.time_taken_ms) && (
                <tr>
                  <td className={styles.rowLabel}>{t.challenge?.time_label ?? 'Time'}</td>
                  <td className={styles.cellValue}>{state.myTimeTakenMs > 0 ? formatTime(state.myTimeTakenMs) : '—'}</td>
                  <td className={styles.cellValue}>{state.challenger.time_taken_ms ? formatTime(state.challenger.time_taken_ms) : '—'}</td>
                </tr>
              )}
              {catBreakdown.map((cb) => (
                <tr key={cb.category}>
                  <td className={styles.rowLabel}>{cb.label}</td>
                  <td className={styles.cellValue}>{cb.mine}/{cb.total}</td>
                  <td className={styles.cellValue}>{cb.theirs}/{cb.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            className={styles.detailToggle}
            onClick={() => {
              if (!detailOpen) track('language', 'challenge', 'detail_expand', { challenge_id: state.meta.id });
              setDetailOpen(!detailOpen);
            }}
          >
            {t.challenge?.see_questions ?? 'See all questions'} {detailOpen ? '▲' : '▼'}
          </button>

          {detailOpen && (
            <ol className={styles.questionList}>
              {state.questions.map((q, i) => {
                const myAnswer = state.myAnswers.find((a) => a.questionId === q.source_question_id);
                const challengerAnswer = state.challenger.answers.find((a) => a.source_question_id === q.source_question_id);
                const myCorrect = myAnswer ? myAnswer.selectedOption === q.correct_answer_index : false;
                const opts = q.options[lk];

                return (
                  <li
                    key={q.source_question_id}
                    className={`${styles.questionItem} ${myCorrect ? styles.qCorrect : styles.qIncorrect}`}
                  >
                    <div className={styles.questionItemHeader}>
                      <span className={styles.qNum}>Q{i + 1}</span>
                      <Badge>{categoryLabels[q.category]}</Badge>
                      <span className={styles.resultIcon} aria-hidden="true">
                        {myCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    <p className={styles.qText}>{q.question_text[lk]}</p>
                    <ul className={styles.optionsList}>
                      {opts.map((opt, idx) => {
                        const isMySelection = myAnswer?.selectedOption === idx;
                        const isChallengerSelection = challengerAnswer?.selected_answer_index === idx;
                        const isCorrectOpt = idx === q.correct_answer_index;
                        let cls = styles.optItem;
                        if (isCorrectOpt) cls += ` ${styles.optCorrect}`;
                        else if (isMySelection && !myCorrect) cls += ` ${styles.optWrong}`;

                        return (
                          <li key={idx} className={cls}>
                            {opt}
                            {isMySelection && <span className={styles.selectedMark}> ← you</span>}
                            {isChallengerSelection && <span className={styles.selectedMark}> ← {challengerName}</span>}
                          </li>
                        );
                      })}
                    </ul>
                    {!myCorrect && q.explanation && (
                      <p className={styles.qExplanation}>{q.explanation[lk]}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          <div className={styles.resultActions}>
            <div className={styles.shareToneToggle}>
              <button
                type="button"
                className={`${styles.toneButton} ${shareTone === 'competitive' ? styles.toneActive : ''}`}
                onClick={() => setShareTone('competitive')}
              >
                {t.challenge?.tone_competitive ?? 'Competitive'}
              </button>
              <button
                type="button"
                className={`${styles.toneButton} ${shareTone === 'collaborative' ? styles.toneActive : ''}`}
                onClick={() => setShareTone('collaborative')}
              >
                {t.challenge?.tone_collaborative ?? 'Collaborative'}
              </button>
            </div>
            <Button
              onClick={() => {
                const baseUrl = window.location.origin;
                const url = `${baseUrl}/challenge/${code}`;
                const text = shareTone === 'competitive'
                  ? (t.challenge?.share_competitive ?? 'I scored {n}/{total} on the Chidigo quiz. Think you can beat me? {link}')
                      .replace('{n}', String(state.score))
                      .replace('{total}', String(state.total))
                      .replace('{link}', url)
                  : (t.challenge?.share_collaborative ?? 'Come take this Digo quiz with me! {link}')
                      .replace('{link}', url);
                track('language', 'challenge', 'share_back', { challenge_id: state.meta.id, action: 'reshare', message_tone: shareTone });
                if (navigator.share) {
                  navigator.share({ title: 'Chidigo Quiz Challenge', text, url }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(text);
                }
              }}
            >
              {t.challenge?.challenge_button ?? 'Challenge a Friend'}
            </Button>
            <Button variant="ghost" onClick={() => {
              track('language', 'challenge', 'share_back', { challenge_id: state.meta.id, action: 'new_challenge' });
              window.location.href = '/language/quiz';
            }}>
              {t.challenge?.play_again ?? 'Play Again'}
            </Button>
          </div>

          {!user && (
            <div className={styles.signupPrompt}>
              <p>{t.challenge?.signup_prompt ?? 'Sign up to save your results and challenge others'}</p>
              <Button variant="ghost" onClick={() => {
                track('language', 'challenge', 'signup_prompt', { challenge_id: state.meta.id, result: 'opened' });
                setSheetOpen(true);
              }}>
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
        onClose={() => {
          if (state.type === 'results' && !user) {
            track('language', 'challenge', 'signup_prompt', { challenge_id: state.meta.id, result: 'dismissed' });
          }
          setSheetOpen(false);
        }}
        title={t.auth?.sign_in_to_save ?? 'Sign in to save favourites'}
      />
    </div>
  );
}
