#!/usr/bin/env python3
"""Bump public/data/data-version.json so installed apps drop their cached data.

The service worker serves data files stale-while-revalidate and only clears a
cache when that cache's version here changes. Run after changing app data:

    python3 scripts/bump-data-version.py dict proverbs quiz
"""
import json, os, sys
from datetime import datetime, timezone

PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'data-version.json')
KEYS = ('dict', 'proverbs', 'quiz')

keys = sys.argv[1:] or list(KEYS)
bad = [k for k in keys if k not in KEYS]
if bad:
    sys.exit(f'unknown key(s): {", ".join(bad)} (expected {", ".join(KEYS)})')

with open(PATH) as f:
    v = json.load(f)
stamp = datetime.now(timezone.utc).strftime('%Y.%m.%d.%H%M')
for k in keys:
    v[k] = stamp
v['version'] = stamp
with open(PATH, 'w') as f:
    json.dump(v, f, indent=2)
    f.write('\n')
print(f'data-version: {", ".join(keys)} -> {stamp}')
