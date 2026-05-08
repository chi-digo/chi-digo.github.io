#!/usr/bin/env python3
"""
Apply generated translations to proverbs data.
Reads patches from /tmp/proverb-patches.json and applies to index.json.
"""
import json
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "../public/data/proverbs/index.json")
PATCHES_PATH = "/tmp/proverb-patches.json"

def main():
    with open(DATA_PATH, "r") as f:
        proverbs = json.load(f)

    with open(PATCHES_PATH, "r") as f:
        patches = json.load(f)

    patch_map = {p["id"]: p for p in patches}

    stats = {"idiomatic_en": 0, "swahili": 0, "idiomatic_sw": 0, "commentary_sw": 0}

    for proverb in proverbs:
        pid = proverb["id"]
        patch = patch_map.get(pid)
        if not patch:
            continue

        # Initialize new fields if missing
        if "idiomatic_sw" not in proverb:
            proverb["idiomatic_sw"] = ""
        if "commentary_sw" not in proverb:
            proverb["commentary_sw"] = ""
        if "commentary_dg" not in proverb:
            proverb["commentary_dg"] = ""
        if "field_sources" not in proverb:
            proverb["field_sources"] = {}

        # Apply patches
        if "idiomatic_en" in patch and not proverb.get("idiomatic_en"):
            proverb["idiomatic_en"] = patch["idiomatic_en"]
            proverb["field_sources"]["idiomatic_en"] = "ai-draft"
            stats["idiomatic_en"] += 1

        if "swahili" in patch and not proverb.get("swahili"):
            proverb["swahili"] = patch["swahili"]
            proverb["swahili_relationship"] = patch.get("swahili_relationship", "translation")
            proverb["field_sources"]["swahili"] = "ai-draft"
            stats["swahili"] += 1

        if "idiomatic_sw" in patch and not proverb.get("idiomatic_sw"):
            proverb["idiomatic_sw"] = patch["idiomatic_sw"]
            proverb["field_sources"]["idiomatic_sw"] = "ai-draft"
            stats["idiomatic_sw"] += 1

        if "commentary_sw" in patch and not proverb.get("commentary_sw"):
            proverb["commentary_sw"] = patch["commentary_sw"]
            proverb["field_sources"]["commentary_sw"] = "ai-draft"
            stats["commentary_sw"] += 1

        # Mark existing fields with original source
        if proverb.get("literal_en") and "literal_en" not in proverb.get("field_sources", {}):
            proverb["field_sources"]["literal_en"] = "original"
        if proverb.get("commentary_en") and "commentary_en" not in proverb.get("field_sources", {}):
            proverb["field_sources"]["commentary_en"] = "original"

    with open(DATA_PATH, "w") as f:
        json.dump(proverbs, f, indent=2, ensure_ascii=False)

    print(f"Applied patches:")
    for k, v in stats.items():
        print(f"  {k}: {v}")

    # Final stats
    total = len(proverbs)
    print(f"\nFinal coverage ({total} proverbs):")
    for field in ["idiomatic_en", "swahili", "idiomatic_sw", "commentary_sw", "commentary_en"]:
        count = sum(1 for p in proverbs if p.get(field))
        print(f"  {field}: {count}/{total}")

if __name__ == "__main__":
    main()
