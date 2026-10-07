#!/usr/bin/env python3
"""Rebuild the dictionary search indexes (public/data/*.idx.json) and the letter
counts in public/data/index.json from the letter files (public/data/*.json).

The letter files are the source of truth. Run after ANY dictionary edit, otherwise
search shows stale definitions, orphaned rows for deleted entries, or misses new
entries. Keeps the compact JSON format.

    python3 scripts/sync-dictionary-index.py          # rebuild
    python3 scripts/sync-dictionary-index.py --check  # report only, exit 1 if stale
"""
import glob, json, os, sys

check = '--check' in sys.argv
stale_files = []

def row(e):
    senses = e.get('senses') or [{}]
    return {
        'sk': e['sort_key'], 'hw': e['headword'], 'id': e['id'], 'pos': e.get('pos'),
        'eq': ', '.join(e.get('equivalents_en') or []),
        'eq_sw': ', '.join(e.get('equivalents_sw') or []),
        'eq_dg': senses[0].get('definition_dg') or '',
    }

for idx_path in sorted(glob.glob('public/data/*.idx.json')):
    letter = json.load(open(idx_path.replace('.idx.json', '.json')))
    raw = open(idx_path).read()
    want = [row(e) for e in sorted(letter['entries'], key=lambda e: e['sort_key'])]
    if json.loads(raw) != want:
        stale_files.append(idx_path)
        if not check:
            with open(idx_path, 'w') as f:
                f.write(json.dumps(want, ensure_ascii='\\u' in raw, separators=(',', ':')) + ('\n' if raw.endswith('\n') else ''))

# letter counts in index.json
ip = 'public/data/index.json'
raw = open(ip).read(); meta = json.loads(raw); meta_changed = False
for L, v in meta['letters'].items():
    d = json.load(open(f"public/data/{L.replace(chr(39), '_')}.json"))
    new = {'count': len(d['entries']), 'first': d['entries'][0]['headword'], 'last': d['entries'][-1]['headword']}
    if any(v.get(k) != new[k] for k in new):
        v.update(new); meta_changed = True
total = sum(v['count'] for v in meta['letters'].values())
if meta.get('total_entries') != total:
    meta['total_entries'] = total; meta_changed = True
if meta_changed:
    stale_files.append(ip)
    if not check:
        compact = not raw.lstrip().startswith('{\n')
        open(ip, 'w').write(json.dumps(meta, ensure_ascii=False, separators=(',', ':')) if compact else json.dumps(meta, ensure_ascii=False, indent=2) + '\n')

print(f"{'stale' if check else 'rebuilt'} files: {len(stale_files)}  (total entries: {total})")
if not check:
    # Dictionary data changed: make installed apps drop their cached copy
    import subprocess
    subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'bump-data-version.py'), 'dict'], check=True)
sys.exit(1 if (check and stale_files) else 0)
