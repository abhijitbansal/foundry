#!/usr/bin/env python3
"""One-shot recovery: rebuild data/stats-archive.json's `repos` section from
every committed revision of data/stats.json, per-field max, allowlist-filtered.

Ran once, on 2026-09-06, to recover the per-repo history that existed only in
this repo's own git history — parse_sessions.py archived per-DAY aggregates
across the ~30-day transcript purge but not per-REPO rollups, so repos aged
out of data/stats.json one by one and their buildings vanished from the
homepage yard (ten in July, seven by September).

Committed for auditability rather than for reuse: rerunning it is harmless
(it only ever raises a value to a historical max) but pointless, because
parse_sessions.py now accretes the same rows on every run. Anyone checking
that the recovered numbers are real can rerun this and diff.

The allowlist filter is the load-bearing part. Revision 77f8f53 predates the
privacy sanitization and carries per-repo rows for scratch clones, hashed
project directories and `(projects root)` — none of which may be republished.
"""
import json, subprocess, sys, collections
sys.path.insert(0, 'scripts/stats')
import parse_sessions as ps

SCALARS = ("sessions","user_msgs","assistant_msgs","lines_added","lines_removed",
           "files_written","files_edited","in_tokens","out_tokens",
           "cache_read_tokens","cache_creation_tokens","image_count")
NESTED = {"top_tools":"tools","top_agents":"agents","top_skills":"skills","models":"models"}

revs = subprocess.run(["git","log","--format=%H","--","data/stats.json"],
                      capture_output=True, text=True, check=True).stdout.split()
acc = {}
for rev in revs:
    raw = subprocess.run(["git","show",f"{rev}:data/stats.json"],
                         capture_output=True, text=True)
    if raw.returncode != 0:
        continue
    try:
        doc = json.loads(raw.stdout)
    except Exception:
        continue
    for row in doc.get("repos", []):
        r = row.get("repo")
        if r not in ps.PROJECTS_ALLOWLIST:
            continue
        cur = acc.setdefault(r, {})
        for k in SCALARS:
            v = row.get(k)
            if isinstance(v, (int, float)):
                cur[k] = max(int(cur.get(k, 0)), int(v))
        for src, dst in NESTED.items():
            pairs = row.get(src) or []
            if not pairs:
                continue
            m = cur.setdefault(dst, {})
            for entry in pairs:
                if isinstance(entry, (list, tuple)) and len(entry) == 2:
                    name, cnt = entry
                    if isinstance(cnt, (int, float)):
                        m[name] = max(int(m.get(name, 0)), int(cnt))
        f, l = row.get("first_ts"), row.get("last_ts")
        if f and (cur.get("first_ts") is None or f < cur["first_ts"]): cur["first_ts"] = f
        if l and (cur.get("last_ts") is None or l > cur["last_ts"]): cur["last_ts"] = l
        if row.get("prompts") and not cur.get("prompts"):
            cur["prompts"] = row["prompts"]

assert all(r in ps.PROJECTS_ALLOWLIST for r in acc), "non-allowlisted repo leaked into the seed"

# Merge into whatever the archive already holds rather than replacing it:
# parse_sessions.py's own rows carry breakdowns and live-window data this
# walk can't see (committed snapshots only keep each repo's top-5/6 tail),
# and a straight assignment would throw them away.
path = "data/stats-archive.json"
doc = json.load(open(path))
existing = doc.get("repos") or {}
for r, rec in acc.items():
    cur = dict(existing.get(r) or {})
    for k, v in rec.items():
        if k == "prompts":
            # A percentile summary, not a counter — keep whichever was
            # computed from more prompts, same rule parse_sessions.py uses.
            if (v or {}).get("count", 0) > ((cur.get(k) or {}).get("count", 0)):
                cur[k] = v
        elif isinstance(v, int):
            cur[k] = max(int(cur.get(k, 0) or 0), v)
        elif isinstance(v, dict):
            m = dict(cur.get(k) or {})
            for name, cnt in v.items():
                m[name] = max(int(m.get(name, 0) or 0), int(cnt))
            cur[k] = m
        elif k == "first_ts":
            cur[k] = min([t for t in (cur.get(k), v) if t] or [None])
        elif k == "last_ts":
            cur[k] = max([t for t in (cur.get(k), v) if t] or [None])
        elif k not in cur:
            cur[k] = v
    existing[r] = cur
doc["repos"] = {r: existing[r] for r in sorted(existing)}
with open(path, "w") as fh:
    json.dump(doc, fh, indent=2); fh.write("\n")
print(f"seeded {len(acc)} repos from {len(revs)} revisions:")
for r in sorted(acc, key=lambda x: -acc[x].get("lines_added", 0)):
    print(f"  {r:16} sessions={acc[r].get('sessions',0):5} lines={acc[r].get('lines_added',0):7}")
