# Mini Spec: Sense Picker for Dictionary Word Sharing

## Problem

When a user shares a dictionary word that has multiple senses (meanings), the share card always renders sense #1. The user has no way to choose which meaning appears on the shared image. For polysemous words like *-enda* (1. go, 2. love) or *kala* (1. eat, 2. past tense marker), the first sense may not be the one the user wants to share.

## Proposed Flow

1. User views a word → sees all senses listed (unchanged)
2. User taps the share button → ShareMenu opens (unchanged)
3. **If `entry.senses.length > 1`:** a sense picker appears inline in the ShareMenu before the share actions
4. User selects a sense (default: sense 1, already selected) — card re-renders with that sense
5. User taps "Share as image" → renders the selected sense
6. **If `entry.senses.length === 1`:** flow is unchanged (no picker shown)

## UX Design

The picker appears as a row of numbered pills inside the ShareMenu dropdown, with a definition preview below:

```
┌─────────────────────────┐
│  MEANING                │
│  [1]  [2]  [3]          │   ← numbered pills, selected = filled
│  "to go, to walk"       │   ← preview of selected sense (aria-live)
│─────────────────────────│
│  🖼  Share as image      │
│  🔗  Copy link           │
└─────────────────────────┘
```

### Design decisions (informed by UX review)

- **Inline pills** over modal — avoids extra step for a lightweight pre-action decision. Mirrors Google Translate's inline variant chips.
- **`role="radiogroup"` + `role="radio"`** — proper ARIA semantics for a single-selection group. `aria-checked` indicates the active pill. Screen readers announce the selection.
- **`aria-live="polite"` on preview** — screen readers announce the definition when the user switches senses.
- **44px min hit area** on pills — meets Apple/WCAG touch target guidelines.
- **Definition preview truncated at 40 chars** with ellipsis — keeps the dropdown compact. Fallback chain: `definition → equivalents_en → empty`.
- **`sensePicker` and `proverbLangToggle` are mutually exclusive** — one is for proverbs, the other for dictionary words. Never shown together.
- **Sense selection resets on word navigation** — `shareSense` resets to 0 when `headword` changes. Persists while viewing the same word.
- **Re-prerender on sense change** — canvas render is fast (<50ms); the "Generating…" flash is negligible.

## Implementation

### `renderWordCard(entry, locale, senseIndex?)` — canvas.ts
- Accepts optional `senseIndex` (default 0)
- `getDefinition` uses `entry.senses[senseIndex]`
- Shows sense number on card when entry has multiple senses

### `prerenderWord(entry, locale, senseIndex?)` — useShareCard.ts
- Passes `senseIndex` through to `renderWordCard`

### `ShareMenu` — new `sensePicker` prop
```ts
sensePicker?: {
  count: number;
  selected: number;
  onSelect: (index: number) => void;
  getLabel: (index: number) => string;  // truncated def preview
};
```
Renders pills + preview when `count > 1`.

### `DictionaryClient.tsx`
- `shareSense` state in both `FeaturedWordCard` and `WordView`
- Helper `getSenseLabel(entry, index, locale)` — returns truncated definition
- `sensePicker` prop wired to ShareMenu; `onSelect` triggers `prerenderWord` with new index
- `shareSense` resets to 0 on headword change

### i18n
Added `share.meaning` key: "Meaning" / "Maana" / "Mana"
