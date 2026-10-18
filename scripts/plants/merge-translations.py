"""Merge Swahili/Digo translations into plants.json (spec 33 §10.4).

    python3 scripts/plants/merge-translations.py <dir-with-out_sw_*.json-and-out_dg_*.json> [review-file-name.md]

(run from chi-digo; review lists are written to ../context/plants, which stays private)

Translation files are produced by the translation briefs (one list per batch):
  out_sw_*.json  {slug, teaser, summary, sections{}, related_reasons[{slug,text}], parts[{term,definition,use,meaning}]}
  out_dg_*.json  the same, but each text is {text, conf: H|M|L, note}
Every merged field is marked `ai-draft` in field_sources. Medium/low-confidence Digo is listed in
context/plants/translation-review-dg.md for the speaker.
"""
import glob, json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parents[2] / 'content' / 'plants'
REVIEW_DIR = Path(__file__).resolve().parents[3] / 'context' / 'plants'
src = Path(sys.argv[1])
# Each translation batch gets its own review file, so earlier review lists (and their decisions) are never overwritten.
review_name = sys.argv[2] if len(sys.argv) > 2 else 'translation-review-dg.md'
plants = json.loads((HERE / 'plants.json').read_text())
by = {p['slug']: p for p in plants}


def val(x):
    """(text, conf, note) for a Swahili string or a Digo {text, conf, note} object."""
    if x is None:
        return None, None, None
    if isinstance(x, dict):
        return x.get('text'), x.get('conf'), x.get('note')
    return x, None, None


review = []
counts = {}
for lang in ('sw', 'dg'):
    files = sorted(f for f in glob.glob(str(src / f'out_{lang}_*.json')) if not f.endswith('_glossary.json'))
    n = 0
    for f in files:
        for row in json.loads(Path(f).read_text()):
            p = by.get(row['slug'])
            if not p:
                print(f'unknown slug {row["slug"]} in {f}')
                continue
            n += 1

            def put(target, value, where):
                text, conf, note = val(value)
                if target is None or not text:
                    return
                target[lang] = text
                if lang == 'dg' and conf in ('M', 'L'):
                    review.append((p, where, conf, text, note))

            put(p['teaser'], row.get('teaser'), 'teaser')
            put(p['summary'], row.get('summary'), 'summary')
            for key, value in (row.get('sections') or {}).items():
                put((p['sections'] or {}).get(key), value, key)
            reasons = {r['slug']: r for r in row.get('related_reasons') or []}
            for r in p['related']:
                if r['slug'] in reasons:
                    put(r['reason'], reasons[r['slug']].get('text'), f"related → {r['slug']}")
            # Match by position when the lists line up: a plant can use the same part word twice
            # (mnazi: kumbi, ndifu, nazi), and matching by word would give both the second entry's text.
            tr_parts = row.get('parts') or []
            same_order = [x['term'] for x in tr_parts] == [x['term'] for x in p.get('parts') or []]
            by_term = {x['term']: x for x in tr_parts}
            for idx, part in enumerate(p.get('parts') or []):
                tr = tr_parts[idx] if same_order else by_term.get(part['term'])
                if not tr:
                    continue
                for field in ('definition', 'use', 'meaning'):
                    put(part.get(field), tr.get(field), f"part {part['term']} · {field}")
            p.setdefault('field_sources', {})[f'prose_{lang}'] = 'ai-draft'
    counts[lang] = n

(HERE / 'plants.json').write_text(json.dumps(plants, ensure_ascii=False, indent=1))

# Glossary of general plant-part terms (out_<lang>_glossary.json: [{term, definition, meaning}]).
glossary = json.loads((HERE / 'glossary.json').read_text())
by_term = {g['term']: g for g in glossary}
for lang in ('sw', 'dg'):
    gfile = src / f'out_{lang}_glossary.json'
    if not gfile.exists():
        continue
    for row in json.loads(gfile.read_text()):
        g = by_term.get(row['term'])
        if not g:
            print(f"unknown glossary term {row['term']}")
            continue
        for field in ('definition', 'meaning'):
            text, conf, note = val(row.get(field))
            if g.get(field) and text:
                g[field][lang] = text
                if lang == 'dg' and conf in ('M', 'L'):
                    review.append(({'slug': 'glossary', 'digo_headword': 'Glossary', 'english': None}, f"{row['term']} · {field}", conf, text, note))
    counts[f'{lang}_glossary'] = len(glossary)
(HERE / 'glossary.json').write_text(json.dumps(glossary, ensure_ascii=False, indent=1))

if review:
    lines = ['# Plants: Digo translations to review', '',
             'Machine-drafted Digo marked medium (M) or low (L) confidence by the translators. Fix the text in `plants.json` (the `dg` value), then rebuild and sync. High-confidence blocks are not listed.', '',
             f'{sum(1 for r in review if r[2] == "L")} low, {sum(1 for r in review if r[2] == "M")} medium.', '']
    current = None
    for p, where, conf, text, note in sorted(review, key=lambda r: (r[0]['slug'], r[2] != 'L')):
        if p['slug'] != current:
            current = p['slug']
            lines += ['', f"## {p['digo_headword'] or p['english']} (`{p['slug']}`)", '']
        lines.append(f"- **{conf}** · {where}: {text}" + (f"  \n  *Note:* {note}" if note else ''))
    out = REVIEW_DIR / review_name
    if out.exists() and review_name == 'translation-review-dg.md':
        sys.exit('refusing to overwrite translation-review-dg.md; pass a new review file name as the second argument')
    out.write_text('\n'.join(lines) + '\n')

print(f"merged: sw {counts.get('sw', 0)} plants, dg {counts.get('dg', 0)} plants; Digo review items: {len(review)}")
