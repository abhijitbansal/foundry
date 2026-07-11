#!/usr/bin/env python3
"""
Parse local Claude Code session transcripts into data/stats.json.

Source : ~/.claude/projects/**/*.jsonl   (one file = one session, this
         machine only — there's no API for cross-machine session history)
Output : <repo root>/data/stats.json

Adapted from ~/projects/cc-dashboard/parse_sessions.py (same schema, same
aggregation logic) with two differences:
1. Output path is this repo's data/stats.json, not cc-dashboard's own.
2. The per-repo `repos` array is filtered to PROJECTS.md's public-facing
   repo names before writing. Unfiltered, this mines EVERY local project
   directory's session/LOC/tool/model activity — including scratch clones,
   abandoned prototypes, and hashed/anonymized dir names never meant to be
   publicly enumerable. This repo is public; that array is not. Site-wide
   aggregate totals (totals/daily_*/top_tools/models/etc) are NOT filtered
   — those carry no repo names and are meant to cover all activity, per
   the "always all the stats since May 1st 2026" telemetry requirement.

Method notes (surfaced on the site so numbers are interpretable):
- "lines added/removed" are TRANSCRIPT-DERIVED from Edit/Write/MultiEdit tool
  inputs, NOT from git. An Edit counts the line-spans of old_string/new_string,
  so a 1-char tweak inside a 10-line block counts as 10 removed + 10 added.
  This is the standard transcript approximation; it tracks editing *effort*,
  not net git churn.
- "prompt size" counts only human-authored user text (string content or text
  blocks), excluding tool_result feedback. Approx tokens = chars / 4.
- tokens come from message.usage on assistant records (input / output / cache).
"""
import json
import os
import glob
import collections
import re
from datetime import datetime, timezone, timedelta

HOME = os.path.expanduser("~")
ROOT = os.path.join(HOME, ".claude", "projects")
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
OUT = os.path.join(REPO_ROOT, "data", "stats.json")

# Claude Code purges local transcripts after ~30 days (cleanupPeriodDays),
# so a fresh parse can only see a sliding window — an earlier run of this
# script had data back to 2026-05-22 that a later run silently lost. The
# archive file accretes per-day aggregates across runs so "always all the
# stats since May 1st 2026" survives transcript rotation. Committed to the
# repo like data/stats.json; per-field max is the merge rule (a past day's
# true counts never shrink — a lower value only ever means transcripts for
# that day were purged mid-window).
ARCHIVE = os.path.join(REPO_ROOT, "data", "stats-archive.json")

# per-day archived fields (besides "sessions" and "thinking_blocks")
DAY_FIELDS = (
    "user_msgs", "assistant_msgs", "lines_added", "lines_removed",
    "files_written", "files_edited", "in_tokens", "out_tokens",
    "cache_read_tokens", "cache_creation_tokens",
)

IMAGE_EXTS = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic")
CHARS_PER_TOKEN = 4  # rough approximation for display only

# PROJECTS.md's repo inventory — keep in sync with that file by hand (it
# changes rarely; a drifted allowlist just under- or over-hides a repo, it
# doesn't silently leak anything since this is an allowlist, not a denylist).
PROJECTS_ALLOWLIST = {
    "cubby", "doc-scan", "floorprint", "folix",
    "claude-skills", "cartoon", "memekit", "sift",
    "foundry", "design-system", "cubby-site", "paperix-site",
    "floorprint-site", "mr_lender", "second-wind",
}


def line_span(s):
    """Number of lines a string occupies (0 for empty)."""
    if not s:
        return 0
    return s.count("\n") + 1


def repo_from_path(path):
    """Map an absolute cwd to a repo bucket."""
    if not path:
        return None
    parts = path.split("/")
    if "projects" in parts:
        i = parts.index("projects")
        if i + 1 < len(parts) and parts[i + 1]:
            return parts[i + 1]
        return "(projects root)"
    return "other"


def repo_from_dirname(dirname):
    """Decode the encoded project dir name when no cwd is present."""
    # e.g. -Users-abhijitbansal-projects-doc-scan  ->  /Users/.../projects/doc-scan
    decoded = dirname.replace("-", "/")
    return repo_from_path(decoded) or "other"


def iter_image_paths(obj):
    """Yield image file paths found anywhere in a nested input/result object."""
    if isinstance(obj, str):
        low = obj.lower()
        if low.endswith(IMAGE_EXTS) and ("/" in obj or "\\" in obj):
            yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from iter_image_paths(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from iter_image_paths(v)


def new_session():
    return {
        "session_id": None,
        "repo": None,
        "cwd": None,
        "git_branches": set(),
        "models": collections.Counter(),
        "model_tokens": collections.defaultdict(lambda: collections.Counter()),
        "model_day": collections.defaultdict(lambda: collections.defaultdict(lambda: collections.Counter())),
        "versions": set(),
        "first_ts": None,
        "last_ts": None,
        "user_msgs": 0,
        "assistant_msgs": 0,
        "prompt_chars": [],          # one entry per human prompt
        "thinking_blocks": 0,
        "tools": collections.Counter(),
        "agents": collections.Counter(),
        "skills": collections.Counter(),
        "slash_commands": collections.Counter(),
        "mcp_tools": collections.Counter(),
        "lines_added": 0,
        "lines_removed": 0,
        "files_written": 0,
        "files_edited": 0,
        "in_tokens": 0,
        "out_tokens": 0,
        "cache_read_tokens": 0,
        "cache_creation_tokens": 0,
        "web_search": 0,
        "web_fetch": 0,
        "image_paths": set(),
        "had_pr_link": False,
    }


SLASH_RE = re.compile(r"<command-name>\s*(/[^<\s]+)", re.I)


def handle_user(d, S):
    msg = d.get("message", {})
    content = msg.get("content")
    if isinstance(content, str):
        text = content
    elif isinstance(content, list):
        # only count human text blocks; tool_result blocks are tool output
        texts = [b.get("text", "") for b in content
                 if isinstance(b, dict) and b.get("type") == "text"]
        # if the message is purely tool_result, it's not a typed prompt
        is_tool_feedback = any(isinstance(b, dict) and b.get("type") == "tool_result"
                               for b in content)
        text = "\n".join(t for t in texts if t)
        # collect images from tool_result attachments too
        for p in iter_image_paths(content):
            S["image_paths"].add(p)
        if is_tool_feedback and not text:
            return  # pure tool feedback, not a human prompt
    else:
        return

    if not text.strip():
        return
    S["user_msgs"] += 1
    S["prompt_chars"].append(len(text))
    m = SLASH_RE.search(text)
    if m:
        S["slash_commands"][m.group(1).split()[0]] += 1


def handle_assistant(d, S):
    S["assistant_msgs"] += 1
    if not S["cwd"] and d.get("cwd"):
        S["cwd"] = d["cwd"]
    if d.get("gitBranch"):
        S["git_branches"].add(d["gitBranch"])
    if d.get("version"):
        S["versions"].add(d["version"])
    ts = d.get("timestamp")
    if ts:
        if S["first_ts"] is None or ts < S["first_ts"]:
            S["first_ts"] = ts
        if S["last_ts"] is None or ts > S["last_ts"]:
            S["last_ts"] = ts

    msg = d.get("message", {})
    u = msg.get("usage") or {}
    model = msg.get("model")
    if model:
        S["models"][model] += 1
        mt = S["model_tokens"][model]
        mt["messages"] += 1
        mt["in"] += u.get("input_tokens", 0) or 0
        mt["out"] += u.get("output_tokens", 0) or 0
        mt["cache_read"] += u.get("cache_read_input_tokens", 0) or 0
        mt["cache_creation"] += u.get("cache_creation_input_tokens", 0) or 0
        if ts:
            dm = S["model_day"][ts[:10]][model]
            dm["messages"] += 1
            dm["in"] += u.get("input_tokens", 0) or 0
            dm["out"] += u.get("output_tokens", 0) or 0
            dm["cache_read"] += u.get("cache_read_input_tokens", 0) or 0
            dm["cache_creation"] += u.get("cache_creation_input_tokens", 0) or 0
    S["in_tokens"] += u.get("input_tokens", 0) or 0
    S["out_tokens"] += u.get("output_tokens", 0) or 0
    S["cache_read_tokens"] += u.get("cache_read_input_tokens", 0) or 0
    S["cache_creation_tokens"] += u.get("cache_creation_input_tokens", 0) or 0
    stu = u.get("server_tool_use") or {}
    S["web_search"] += stu.get("web_search_requests", 0) or 0
    S["web_fetch"] += stu.get("web_fetch_requests", 0) or 0

    content = msg.get("content")
    if not isinstance(content, list):
        return
    for b in content:
        if not isinstance(b, dict):
            continue
        bt = b.get("type")
        if bt == "thinking":
            S["thinking_blocks"] += 1
        elif bt == "tool_use":
            name = b.get("name", "?")
            S["tools"][name] += 1
            inp = b.get("input", {}) or {}
            if name.startswith("mcp__"):
                S["mcp_tools"][name] += 1
            if name in ("Agent", "Task"):
                # subagent_type is a fixed, catalog-style value ("general-purpose",
                # "ecc:code-reviewer", "Explore") — safe for a public repo. The
                # `description` fallback is freeform prose written per-dispatch
                # and has been observed to contain private-repo task detail
                # verbatim (e.g. "Implement X1: Add-items-to-collection flow in
                # Cubby iOS app") — never fall back to it here; that field only
                # feeds an internal counter that never reaches the public site.
                st = inp.get("subagent_type") or "(unnamed dispatch)"
                S["agents"][st] += 1
            if name == "Skill":
                S["skills"][inp.get("skill", "?")] += 1
            if name == "Write":
                S["files_written"] += 1
                S["lines_added"] += line_span(str(inp.get("content", "")))
            elif name == "Edit":
                S["files_edited"] += 1
                S["lines_added"] += line_span(str(inp.get("new_string", "")))
                S["lines_removed"] += line_span(str(inp.get("old_string", "")))
            elif name == "MultiEdit":
                for e in inp.get("edits", []) or []:
                    if isinstance(e, dict):
                        S["files_edited"] += 1
                        S["lines_added"] += line_span(str(e.get("new_string", "")))
                        S["lines_removed"] += line_span(str(e.get("old_string", "")))
            # any image paths referenced by tool inputs (Read/SendUserFile/etc)
            for p in iter_image_paths(inp):
                S["image_paths"].add(p)


def parse_file(path, dirname):
    S = new_session()
    S["session_id"] = os.path.splitext(os.path.basename(path))[0]
    try:
        with open(path, "r", errors="replace") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    d = json.loads(line)
                except Exception:
                    continue
                t = d.get("type")
                if t == "user":
                    handle_user(d, S)
                elif t == "assistant":
                    handle_assistant(d, S)
                elif t == "pr-link":
                    S["had_pr_link"] = True
                elif t == "attachment":
                    for p in iter_image_paths(d):
                        S["image_paths"].add(p)
    except Exception:
        return None
    # resolve repo
    S["repo"] = repo_from_path(S["cwd"]) or repo_from_dirname(dirname)
    return S


def main():
    files = glob.glob(os.path.join(ROOT, "**", "*.jsonl"), recursive=True)
    sessions = []
    parsed = skipped = 0
    for path in files:
        dirname = os.path.basename(os.path.dirname(path))
        S = parse_file(path, dirname)
        if S is None:
            skipped += 1
            continue
        # skip empty sessions (no human + no assistant content)
        if S["user_msgs"] == 0 and S["assistant_msgs"] == 0:
            skipped += 1
            continue
        parsed += 1
        sessions.append(S)

    # ---- aggregate ----
    repos = collections.defaultdict(lambda: {
        "sessions": 0, "user_msgs": 0, "assistant_msgs": 0,
        "lines_added": 0, "lines_removed": 0, "files_written": 0, "files_edited": 0,
        "in_tokens": 0, "out_tokens": 0, "cache_read_tokens": 0, "cache_creation_tokens": 0,
        "tools": collections.Counter(), "prompt_chars": [],
        "first_ts": None, "last_ts": None, "models": collections.Counter(),
        "agents": collections.Counter(), "skills": collections.Counter(),
        "image_paths": set(),
    })

    g_tools = collections.Counter()
    g_agents = collections.Counter()
    g_skills = collections.Counter()
    g_slash = collections.Counter()
    g_mcp = collections.Counter()
    g_models = collections.Counter()
    g_versions = collections.Counter()
    g_prompt_chars = []
    daily = collections.Counter()            # date -> sessions active
    daily_tokens = collections.Counter()     # date -> out tokens
    daily_lines = collections.Counter()      # date -> lines added
    day_full = collections.defaultdict(collections.Counter)  # date -> full per-day counters (archived)
    tool_by_month = collections.defaultdict(collections.Counter)
    all_images = set()
    g_model_tokens = collections.defaultdict(lambda: collections.Counter())
    g_model_day = collections.defaultdict(lambda: collections.defaultdict(lambda: collections.Counter()))

    totals = collections.Counter()

    for S in sessions:
        r = S["repo"]
        R = repos[r]
        R["sessions"] += 1
        for k in ("user_msgs", "assistant_msgs", "lines_added", "lines_removed",
                  "files_written", "files_edited", "in_tokens", "out_tokens",
                  "cache_read_tokens", "cache_creation_tokens"):
            R[k] += S[k]
            totals[k] += S[k]
        R["tools"].update(S["tools"])
        R["agents"].update(S["agents"])
        R["skills"].update(S["skills"])
        R["models"].update(S["models"])
        R["prompt_chars"].extend(S["prompt_chars"])
        R["image_paths"].update(S["image_paths"])
        if S["first_ts"] and (R["first_ts"] is None or S["first_ts"] < R["first_ts"]):
            R["first_ts"] = S["first_ts"]
        if S["last_ts"] and (R["last_ts"] is None or S["last_ts"] > R["last_ts"]):
            R["last_ts"] = S["last_ts"]

        g_tools.update(S["tools"])
        g_agents.update(S["agents"])
        g_skills.update(S["skills"])
        g_slash.update(S["slash_commands"])
        g_mcp.update(S["mcp_tools"])
        g_models.update(S["models"])
        for model, mt in S["model_tokens"].items():
            g_model_tokens[model].update(mt)
        for day, models in S["model_day"].items():
            for model, dm in models.items():
                g_model_day[day][model].update(dm)
        for v in S["versions"]:
            g_versions[v] += 1
        g_prompt_chars.extend(S["prompt_chars"])
        all_images.update(S["image_paths"])
        totals["sessions"] += 1
        totals["thinking_blocks"] += S["thinking_blocks"]
        totals["web_search"] += S["web_search"]
        totals["web_fetch"] += S["web_fetch"]

        if S["first_ts"]:
            day = S["first_ts"][:10]
            month = S["first_ts"][:7]
            daily[day] += 1
            daily_tokens[day] += S["out_tokens"]
            daily_lines[day] += S["lines_added"]
            rec = day_full[day]
            rec["sessions"] += 1
            rec["thinking_blocks"] += S["thinking_blocks"]
            for k in DAY_FIELDS:
                rec[k] += S[k]
            for tool, c in S["tools"].items():
                tool_by_month[month][tool] += c

    # existing images on disk (for gallery)
    existing_images = sorted(p for p in all_images if os.path.isfile(p))

    def pct(vals, p):
        if not vals:
            return 0
        s = sorted(vals)
        k = int(round((p / 100) * (len(s) - 1)))
        return s[k]

    def summarize_prompts(vals):
        if not vals:
            return {"count": 0, "avg": 0, "median": 0, "p90": 0, "max": 0,
                    "avg_tokens": 0, "hist": []}
        avg = sum(vals) / len(vals)
        # histogram buckets by char length
        buckets = [(0, 50), (50, 150), (150, 400), (400, 1000),
                   (1000, 3000), (3000, 10**9)]
        labels = ["<50", "50-150", "150-400", "400-1k", "1k-3k", "3k+"]
        hist = [0] * len(buckets)
        for v in vals:
            for i, (lo, hi) in enumerate(buckets):
                if lo <= v < hi:
                    hist[i] += 1
                    break
        return {
            "count": len(vals),
            "avg": round(avg, 1),
            "median": pct(vals, 50),
            "p90": pct(vals, 90),
            "max": max(vals),
            "avg_tokens": round(avg / CHARS_PER_TOKEN, 1),
            "hist": list(zip(labels, hist)),
        }

    repo_out = []
    for r, R in repos.items():
        # Privacy allowlist: only PROJECTS.md-listed repos get a per-repo
        # breakdown in the committed, public data/stats.json. Every OTHER
        # repo's activity still counts in the site-wide `totals` above
        # (already accumulated before this filter runs) — only the
        # per-repo row is dropped. See module docstring.
        if r not in PROJECTS_ALLOWLIST:
            continue
        repo_out.append({
            "repo": r,
            "sessions": R["sessions"],
            "user_msgs": R["user_msgs"],
            "assistant_msgs": R["assistant_msgs"],
            "lines_added": R["lines_added"],
            "lines_removed": R["lines_removed"],
            "files_written": R["files_written"],
            "files_edited": R["files_edited"],
            "in_tokens": R["in_tokens"],
            "out_tokens": R["out_tokens"],
            "cache_read_tokens": R["cache_read_tokens"],
            "cache_creation_tokens": R["cache_creation_tokens"],
            "top_tools": R["tools"].most_common(6),
            "top_agents": R["agents"].most_common(5),
            "top_skills": R["skills"].most_common(5),
            "models": R["models"].most_common(),
            "prompts": summarize_prompts(R["prompt_chars"]),
            "first_ts": R["first_ts"],
            "last_ts": R["last_ts"],
            "image_count": len(R["image_paths"]),
        })
    repo_out.sort(key=lambda x: x["lines_added"], reverse=True)

    all_ts = [S["first_ts"] for S in sessions if S["first_ts"]] + \
             [S["last_ts"] for S in sessions if S["last_ts"]]
    date_min = min(all_ts)[:10] if all_ts else None
    date_max = max(all_ts)[:10] if all_ts else None

    # ---- merge this run's per-day aggregates into the persistent archive ----
    archive_days = {}
    if os.path.exists(ARCHIVE):
        try:
            with open(ARCHIVE) as fh:
                loaded = json.load(fh)
            if isinstance(loaded, dict) and isinstance(loaded.get("days"), dict):
                archive_days = loaded["days"]
        except Exception as e:
            raise SystemExit(
                f"ERROR: {ARCHIVE} exists but is unreadable ({e}) — refusing to "
                "overwrite the accreted history; fix or remove the file and rerun."
            )
    live_min_day = min(day_full) if day_full else None
    for day, rec in day_full.items():
        old = archive_days.get(day, {})
        merged = dict(old)
        for k, v in rec.items():
            merged[k] = max(int(old.get(k, 0)), int(v))
        archive_days[day] = merged
    with open(ARCHIVE, "w") as fh:
        json.dump({
            "note": ("Per-day aggregates accreted across parse_sessions.py runs; "
                     "survives the ~30-day local transcript purge. Days before "
                     "2026-06-10 were recovered from an earlier stats.json "
                     "snapshot and only carry sessions/out_tokens/lines_added."),
            "days": {d: archive_days[d] for d in sorted(archive_days)},
        }, fh, indent=2)
        fh.write("\n")

    # Fold archived days that predate this run's live transcript coverage
    # into the all-time totals and daily series (live-covered days already
    # counted above; archived fields missing on a day contribute 0).
    for day, rec in archive_days.items():
        if live_min_day is None or day < live_min_day:
            for k, v in rec.items():
                totals[k] += v
    if archive_days:
        archive_min = min(archive_days)
        date_min = min(date_min, archive_min) if date_min else archive_min
        daily = {d: r.get("sessions", 0) for d, r in archive_days.items()}
        daily_tokens = {d: r.get("out_tokens", 0) for d, r in archive_days.items()}
        daily_lines = {d: r.get("lines_added", 0) for d, r in archive_days.items()}

    # ---- model breakdown: all-time + rolling windows (calendar-inclusive, UTC) ----
    today = datetime.now(timezone.utc).date()
    cutoff_7 = today - timedelta(days=6)
    cutoff_90 = today - timedelta(days=89)

    def model_rows(counters):
        rows = []
        for model, c in counters.items():
            rows.append({
                "model": model,
                "messages": c.get("messages", 0),
                "in_tokens": c.get("in", 0),
                "out_tokens": c.get("out", 0),
                "cache_read_tokens": c.get("cache_read", 0),
                "cache_creation_tokens": c.get("cache_creation", 0),
            })
        rows.sort(key=lambda r: r["out_tokens"], reverse=True)
        return rows

    window_7 = collections.defaultdict(lambda: collections.Counter())
    window_90 = collections.defaultdict(lambda: collections.Counter())
    for day, models in g_model_day.items():
        try:
            day_date = datetime.strptime(day, "%Y-%m-%d").date()
        except ValueError:
            continue
        for model, dm in models.items():
            if day_date >= cutoff_90:
                window_90[model].update(dm)
            if day_date >= cutoff_7:
                window_7[model].update(dm)

    model_breakdown = {
        "window": {
            "today": today.isoformat(),
            "cutoff_7d": cutoff_7.isoformat(),
            "cutoff_90d": cutoff_90.isoformat(),
            "last_activity": date_max,
        },
        "all": model_rows(g_model_tokens),
        "last_7d": model_rows(window_7),
        "last_90d": model_rows(window_90),
    }

    out = {
        "meta": {
            "files_found": len(files),
            "sessions_parsed": parsed,
            "sessions_skipped": skipped,
            "date_min": date_min,
            "date_max": date_max,
            "chars_per_token": CHARS_PER_TOKEN,
        },
        "totals": dict(totals),
        "repos": repo_out,
        "global_prompts": summarize_prompts(g_prompt_chars),
        "top_tools": g_tools.most_common(30),
        "top_agents": g_agents.most_common(20),
        "top_skills": g_skills.most_common(25),
        "top_slash": g_slash.most_common(25),
        "top_mcp": g_mcp.most_common(20),
        "models": g_models.most_common(),
        "model_breakdown": model_breakdown,
        "versions": g_versions.most_common(),
        "daily_sessions": sorted(daily.items()),
        "daily_out_tokens": sorted(daily_tokens.items()),
        "daily_lines": sorted(daily_lines.items()),
        "tool_by_month": {m: c.most_common(8) for m, c in sorted(tool_by_month.items())},
        # No "sample" path list here (cc-dashboard's own schema has one, for
        # its private local gallery view): those paths are absolute local
        # filesystem paths (/Users/abhijitbansal/...) spanning every local
        # project directory, allowlist or not — real leak, confirmed present
        # in an earlier run of this data. Nothing in this site's components
        # reads `images` at all, so there's no functional reason to carry it.
        "images": {
            "referenced": len(all_images),
            "existing_on_disk": len(existing_images),
        },
    }

    with open(OUT, "w") as fh:
        json.dump(out, fh, indent=2)
        fh.write("\n")
    print(f"files_found      : {len(files)}")
    print(f"sessions_parsed  : {parsed}")
    print(f"sessions_skipped : {skipped}")
    print(f"date range       : {date_min} -> {date_max}")
    print(f"repos (public)   : {len(repo_out)}")
    print(f"total out tokens : {totals['out_tokens']:,}")
    print(f"total lines added: {totals['lines_added']:,}")
    print(f"images on disk   : {len(existing_images)} / {len(all_images)} referenced")
    print(f"models (7d)      : {[(r['model'], r['out_tokens']) for r in model_breakdown['last_7d']]}")
    print(f"models (90d)     : {[(r['model'], r['out_tokens']) for r in model_breakdown['last_90d']]}")
    print(f"wrote            : {OUT}")


if __name__ == "__main__":
    main()
