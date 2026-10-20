#!/usr/bin/env python3
"""Rebuild the dictionary search indexes and index.json from the letter files.

Now a wrapper around scripts/dictionary/build-index.ts (spec 34 §15.2), which also
checks the data invariants and bumps the dict data version. Run after ANY dictionary edit.

    python3 scripts/sync-dictionary-index.py          # rebuild
    python3 scripts/sync-dictionary-index.py --check  # check only, exit 1 if stale or invalid
"""
import os, subprocess, sys

root = os.path.join(os.path.dirname(__file__), '..')
sys.exit(subprocess.run(['npx', 'tsx', 'scripts/dictionary/build-index.ts', *sys.argv[1:]], cwd=root).returncode)
