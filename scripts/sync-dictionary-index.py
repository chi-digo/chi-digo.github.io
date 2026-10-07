#!/usr/bin/env python3
"""Rebuild the search-index Digo field (eq_dg) in public/data/*.idx.json from the
letter files (public/data/*.json). Run after ANY edit to dictionary definitions,
otherwise search results show stale text. Keeps the compact JSON format.

    python3 scripts/sync-dictionary-index.py          # rewrite out-of-sync rows
    python3 scripts/sync-dictionary-index.py --check  # report only, exit 1 if stale
"""
import glob, json, sys

check = '--check' in sys.argv
stale = 0
for idx_path in sorted(glob.glob('public/data/*.idx.json')):
    letter_path = idx_path.replace('.idx.json', '.json')
    with open(letter_path) as f:
        letter = json.load(f)
    by_id = {e['id']: e for e in letter['entries']}
    raw = open(idx_path).read()
    rows = json.loads(raw)
    changed = False
    for row in rows:
        entry = by_id.get(row['id'])
        if not entry:
            continue
        senses = entry.get('senses') or [{}]
        want = senses[0].get('definition_dg') or ''
        if row.get('eq_dg', '') != want:
            stale += 1
            row['eq_dg'] = want
            changed = True
    if changed and not check:
        with open(idx_path, 'w') as f:
            f.write(json.dumps(rows, ensure_ascii='\\u' in raw, separators=(',', ':')) + ('\n' if raw.endswith('\n') else ''))
print(f"{'stale' if check else 'synced'} rows: {stale}")
sys.exit(1 if (check and stale) else 0)
