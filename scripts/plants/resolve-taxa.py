"""Resolve each plant's scientific name against the GBIF Backbone Taxonomy (spec 33 §9a).

    python3 scripts/plants/resolve-taxa.py            # plants without a `taxon`
    python3 scripts/plants/resolve-taxa.py --force    # re-resolve everything (before a major release)

Writes `taxon` into plants.json: accepted name, authorship, family, status (ACCEPTED/SYNONYM),
level (species/genus), GBIF key and reference links (GBIF, POWO, IPNI; Index Fungorum for fungi).
Hand fixes (a `note` on the taxon) are kept unless --force. Prints anything fuzzy, synonymous or unresolved.
"""
import json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

PATH = Path(__file__).resolve().parents[2] / 'content' / 'plants' / 'plants.json'
FORCE = '--force' in sys.argv


def query_name(sci):
    s = re.sub(r'\(.*?\)', '', sci or '')
    s = re.sub(r'\b(spp?|ssp|subsp|var)\.?\b.*$', '', s).strip()
    s = s.split(';')[0].split(',')[0].split('/')[0].strip()
    return ' '.join(s.split()[:3])


def api(url):
    return json.load(urllib.request.urlopen(url, timeout=20))


def resolve(name, fungus):
    q = {'name': name, 'verbose': 'false'}
    if not fungus:
        q['kingdom'] = 'Plantae'
    d = api('https://api.gbif.org/v1/species/match?' + urllib.parse.urlencode(q))
    if d.get('matchType') in (None, 'NONE') or (d.get('matchType') == 'HIGHERRANK' and d.get('rank') != 'GENUS'):
        return None, d
    key = d.get('acceptedUsageKey') or d.get('usageKey')
    acc = api(f'https://api.gbif.org/v1/species/{key}') if d.get('acceptedUsageKey') else d
    canon = acc.get('canonicalName')
    author = acc.get('authorship') or (acc.get('scientificName') or '').replace(canon or '', '').strip() or None
    links = {'gbif': f'https://www.gbif.org/species/{key}'}
    if fungus:
        links['index_fungorum'] = 'https://www.indexfungorum.org/Names/Names.asp?SearchTerm=' + urllib.parse.quote(canon)
    else:
        links['powo'] = 'https://powo.science.kew.org/results?q=' + urllib.parse.quote(canon)
        links['ipni'] = 'https://www.ipni.org/?q=' + urllib.parse.quote(canon)
    return {
        'query': name, 'match': d.get('matchType'), 'confidence': d.get('confidence'), 'rank': d.get('rank'), 'resolved': True,
        'matched_name': d.get('scientificName'), 'status': d.get('status'), 'accepted_name': canon,
        'accepted_authorship': author, 'family': acc.get('family'), 'order': acc.get('order'), 'gbif_key': key,
        'level': 'genus' if d.get('rank') == 'GENUS' else 'species', 'links': links,
    }, d


plants = json.loads(PATH.read_text())
for p in plants:
    sci = p.get('scientific') or ''
    if not sci or sci.startswith('Unidentified'):
        p['taxon'] = None
        continue
    if p.get('taxon') and not FORCE:
        continue
    t, raw = resolve(query_name(sci), p['section'] == 'Mushrooms and fungi')
    p['taxon'] = t
    if not t:
        print(f"UNRESOLVED {p['slug']}: {sci} ({raw.get('matchType')}); add a hand fix with a note")
    elif t['match'] == 'FUZZY' or t['status'] == 'SYNONYM':
        print(f"{t['match']} {t['status']} {p['slug']}: {sci} -> {t['accepted_name']}")
    time.sleep(0.05)
PATH.write_text(json.dumps(plants, ensure_ascii=False, indent=1))
print('done')
