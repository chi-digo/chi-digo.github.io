'use client';

import { useReducer, useCallback } from 'react';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { track } from '@/lib/analytics/track';
import { StepIndicator } from './StepIndicator';
import { Step1Message } from './Step1Message';
import { Step2Style } from './Step2Style';
import { Step3Preview } from './Step3Preview';
import { PALETTE_KEYS, buildCustomPalette } from '@/lib/sharing/kanga/palettes';
import { MOTIF_KEYS } from '@/lib/sharing/motifs';
import { PATTERN_KEYS } from '@/lib/sharing/kanga/patterns';
import { COMPOSITION_KEYS, type MjiComposition } from '@/lib/sharing/kanga/compositions';
import type { ProverbStub } from './page';

interface KangaState {
  step: 1 | 2 | 3;
  fumbo: string;
  fumboSource: 'proverb' | 'custom';
  fumboSourceId?: string;
  palette: string;
  customPindoBg: string;
  customMjiBg: string;
  pindoMotif: string;
  mjiComposition: MjiComposition;
  mjiMotif: string;
}

type KangaAction =
  | { type: 'SET_FUMBO'; fumbo: string; source: 'proverb' | 'custom'; sourceId?: string }
  | { type: 'SET_PALETTE'; palette: string }
  | { type: 'SET_CUSTOM_COLOR'; field: 'pindo' | 'mji'; color: string }
  | { type: 'SET_PINDO'; motif: string }
  | { type: 'SET_COMPOSITION'; composition: MjiComposition }
  | { type: 'SET_MJI_MOTIF'; motif: string }
  | { type: 'SET_STEP'; step: 1 | 2 | 3 }
  | { type: 'RESET' };

const INITIAL_STATE: KangaState = {
  step: 1,
  fumbo: '',
  fumboSource: 'custom',
  palette: PALETTE_KEYS[0],
  customPindoBg: '#1B2244',
  customMjiBg: '#C62828',
  pindoMotif: MOTIF_KEYS[0],
  mjiComposition: COMPOSITION_KEYS[0],
  mjiMotif: PATTERN_KEYS[0],
};

function reducer(state: KangaState, action: KangaAction): KangaState {
  switch (action.type) {
    case 'SET_FUMBO':
      return { ...state, fumbo: action.fumbo, fumboSource: action.source, fumboSourceId: action.sourceId };
    case 'SET_PALETTE':
      return { ...state, palette: action.palette };
    case 'SET_CUSTOM_COLOR':
      return action.field === 'pindo'
        ? { ...state, palette: 'custom', customPindoBg: action.color }
        : { ...state, palette: 'custom', customMjiBg: action.color };
    case 'SET_PINDO':
      return { ...state, pindoMotif: action.motif };
    case 'SET_COMPOSITION': {
      const wasGrid = state.mjiComposition === 'grid_repeat';
      const isGrid = action.composition === 'grid_repeat';
      const mjiMotif = wasGrid !== isGrid
        ? (isGrid ? PATTERN_KEYS[0] : MOTIF_KEYS[0])
        : state.mjiMotif;
      return { ...state, mjiComposition: action.composition, mjiMotif };
    }
    case 'SET_MJI_MOTIF':
      return { ...state, mjiMotif: action.motif };
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'RESET':
      return INITIAL_STATE;
    default:
      return state;
  }
}

interface Props {
  proverbs: ProverbStub[];
}

export function KangaCreator({ proverbs }: Props) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const t = useTranslations();
  const { locale } = useLocale();

  const goNext = useCallback(() => {
    if (state.step < 3) {
      const nextStep = (state.step + 1) as 1 | 2 | 3;
      dispatch({ type: 'SET_STEP', step: nextStep });
      window.scrollTo({ top: 0, behavior: 'smooth' });

      track('language', 'kanga', 'step_completed', { step: state.step, locale });
      if (state.step === 1) {
        track('language', 'kanga', 'fumbo_source', { source: state.fumboSource, locale });
      }
      if (state.step === 2) {
        track('language', 'kanga', 'style_selected', {
          palette: state.palette,
          composition: state.mjiComposition,
          pindoMotif: state.pindoMotif,
          mjiMotif: state.mjiMotif,
        });
      }
    }
  }, [state, locale]);

  const goBack = useCallback(() => {
    if (state.step > 1) {
      dispatch({ type: 'SET_STEP', step: (state.step - 1) as 1 | 2 | 3 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.step]);

  const resolvedPalette = state.palette === 'custom'
    ? buildCustomPalette(state.customPindoBg, state.customMjiBg)
    : undefined;

  const canAdvance = state.step === 1 ? state.fumbo.trim().length > 0 : true;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      color: 'var(--fg-default)',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: 'calc(var(--header-height) + 1.5rem) 5.25% 4rem',
      }}>
        {/* Page title */}
        <h1 style={{
          fontFamily: 'var(--font-display, serif)',
          fontWeight: 500,
          fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
          lineHeight: 1.2,
          color: 'var(--color-kaya-deep, #0E1A2A)',
          margin: '0 0 2rem 0',
        }}>
          {t.breadcrumb.kanga}
        </h1>

        {/* Step content */}
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <StepIndicator current={state.step} total={3} />
          </div>
          {state.step === 1 && (
            <Step1Message
              proverbs={proverbs}
              fumbo={state.fumbo}
              fumboSource={state.fumboSource}
              onSetFumbo={(fumbo, source, sourceId) =>
                dispatch({ type: 'SET_FUMBO', fumbo, source, sourceId })
              }
            />
          )}
          {state.step === 2 && (
            <Step2Style
              fumbo={state.fumbo}
              palette={state.palette}
              resolvedPalette={resolvedPalette}
              customPindoBg={state.customPindoBg}
              customMjiBg={state.customMjiBg}
              pindoMotif={state.pindoMotif}
              mjiComposition={state.mjiComposition}
              mjiMotif={state.mjiMotif}
              onSetPalette={(p) => dispatch({ type: 'SET_PALETTE', palette: p })}
              onSetCustomColor={(field, color) => dispatch({ type: 'SET_CUSTOM_COLOR', field, color })}
              onSetPindo={(m) => dispatch({ type: 'SET_PINDO', motif: m })}
              onSetComposition={(c) => dispatch({ type: 'SET_COMPOSITION', composition: c })}
              onSetMjiMotif={(m) => dispatch({ type: 'SET_MJI_MOTIF', motif: m })}
            />
          )}
          {state.step === 3 && (
            <Step3Preview
              spec={{
                fumbo: state.fumbo,
                palette: state.palette,
                resolvedPalette,
                pindoMotif: state.pindoMotif,
                mjiComposition: state.mjiComposition,
                mjiMotif: state.mjiMotif,
              }}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(14, 26, 42, 0.1)',
        }}>
          <button
            onClick={goBack}
            disabled={state.step === 1}
            style={{
              padding: '0.625rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'rgba(14, 26, 42, 0.55)',
              background: 'transparent',
              border: 'none',
              cursor: state.step === 1 ? 'default' : 'pointer',
              opacity: state.step === 1 ? 0 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {t.kanga.back}
          </button>
          {state.step < 3 && (
            <button
              onClick={goNext}
              disabled={!canAdvance}
              style={{
                padding: '0.625rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                background: 'var(--color-kaya-deep, #0E1A2A)',
                color: 'var(--color-hando-cream, #F2EAD7)',
                border: 'none',
                cursor: canAdvance ? 'pointer' : 'not-allowed',
                opacity: canAdvance ? 1 : 0.4,
                transition: 'opacity 0.15s',
              }}
            >
              {t.kanga.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
