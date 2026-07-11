#!/usr/bin/env python3
"""
weekly_stats.py — deterministic weekly-digest data for the /updates page.

Targets the most recently COMPLETED ISO week (Mon-Sun) as of run time, or an
explicit week passed as the first argument (e.g. `2026-W27`). Writes
data/weekly/<YYYY>-W<WW>.json — one file per week, append-only: running this
again for an already-written week overwrites just that week's file (so a
late-arriving transcript can be picked up by a manual re-run), but it never
touches any other week's file. The site reads every file in data/weekly/ and
renders newest-first; nothing here mutates data/stats.json (the all-time
telemetry pipeline is parse_sessions.py, a separate concern).

Sections in the output:
- repos: per-repo weekly rollup (sessions, lines, top tool, top model),
  PROJECTS.md-allowlist-filtered — same rule as parse_sessions.py, and for
  the same reason (this is a public repo).
- heatmap: a 7 (weekday) x 24 (hour) grid of message counts / out-tokens for
  the week, in this machine's local timezone at generation time. This is
  necessarily message-level (not session-level like the main telemetry's
  daily heatmap) since a single session can span many hours.
- releases: PR merges (gh CLI, `is:merged merged:<start>..<end>`) and
  GitHub Releases published in the window, per allowlisted repo. Titles only
  for repos gh reports as public; counts only for private ones — the same
  "curated status only, never repo internals" rule PROJECTS.md applies to
  the site's own project cards. KNOWN LIMITATION: repos that tag a version
  without creating a GitHub Release won't show a version bump here — the
  tags API doesn't expose creation dates without a second API call per tag,
  and that cost wasn't justified for a weekly job. PR merges have no such
  gap (the search API gives merge dates directly). KNOWN LIMITATION 2:
  visibility is checked live at generation time and baked into that week's
  committed JSON permanently — if a repo that was public when its digest
  generated is later made private, the already-committed file still shows
  whatever was public back then. Nothing here re-scans past weeks. If that
  ever matters (a repo goes private specifically because something in an
  old PR title was too revealing), it needs a manual pass over
  data/weekly/*.json for that repo, not just a code fix here.
- highlights: intentionally NOT populated by this script — a separate
  agent step (.claude/agents/weekly-highlights.md) paraphrases this same
  JSON into 1-3 sentences of prose and writes it back into this field. This
  script only ever writes numbers/names it can point at in the raw data.

Usage: python3 weekly_stats.py [YYYY-Www]
"""
import json
import os
import sys
import glob
import subprocess
import collections
from datetime import datetime, date, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import parse_sessions as ps  # noqa: E402 — same-directory sibling module

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
OUT_DIR = os.path.join(REPO_ROOT, "data", "weekly")
GH_OWNER = "abhijitbansal"
WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def target_week(arg):
    """Return (year, week, monday_date, sunday_date) for the target ISO week."""
    if arg:
        year_s, week_s = arg.split("-W")
        year, week = int(year_s), int(week_s)
        monday = date.fromisocalendar(year, week, 1)
    else:
        today = date.today()
        this_monday = today - timedelta(days=today.weekday())
        monday = this_monday - timedelta(days=7)
        year, week, _ = monday.isocalendar()
    sunday = monday + timedelta(days=6)
    return year, week, monday, sunday


def iso_ts_in_week(ts, monday, sunday):
    """monday/sunday are local-calendar dates (from target_week()); ts is a
    UTC transcript timestamp — must localize before comparing, same as
    build_heatmap() does, or a session near midnight can land in the wrong
    week (or get silently dropped from both) depending on the machine's
    UTC offset direction."""
    if not ts:
        return False
    try:
        ts_dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except ValueError:
        return False
    d = ts_dt.astimezone().date()
    return monday <= d <= sunday


def per_repo_rollup(sessions, monday, sunday):
    repos = collections.defaultdict(lambda: {
        "sessions": 0, "lines_added": 0, "lines_removed": 0,
        "tools": collections.Counter(), "models": collections.Counter(),
    })
    for S in sessions:
        if not iso_ts_in_week(S["first_ts"], monday, sunday):
            continue
        r = S["repo"]
        if r not in ps.PROJECTS_ALLOWLIST:
            continue
        R = repos[r]
        R["sessions"] += 1
        R["lines_added"] += S["lines_added"]
        R["lines_removed"] += S["lines_removed"]
        R["tools"].update(S["tools"])
        R["models"].update(S["models"])

    out = []
    for r, R in repos.items():
        top_tool = R["tools"].most_common(1)
        top_model = R["models"].most_common(1)
        out.append({
            "repo": r,
            "sessions": R["sessions"],
            "lines_added": R["lines_added"],
            "lines_removed": R["lines_removed"],
            "top_tool": top_tool[0][0] if top_tool else None,
            "top_model": top_model[0][0] if top_model else None,
        })
    out.sort(key=lambda x: x["lines_added"], reverse=True)
    return out


def build_heatmap(monday, sunday):
    """7x24 grid of {count, out_tokens} for every assistant message in the
    week, bucketed by this machine's local timezone at generation time."""
    grid = [[{"count": 0, "out_tokens": 0} for _ in range(24)] for _ in range(7)]
    files = glob.glob(os.path.join(ps.ROOT, "**", "*.jsonl"), recursive=True)
    week_start_utc = datetime.combine(monday, datetime.min.time(), tzinfo=timezone.utc) - timedelta(days=1)
    week_end_utc = datetime.combine(sunday, datetime.min.time(), tzinfo=timezone.utc) + timedelta(days=2)
    for path in files:
        try:
            with open(path, "r", errors="replace") as fh:
                for line in fh:
                    line = line.strip()
                    if not line or '"type":"assistant"' not in line.replace(" ", ""):
                        continue
                    try:
                        d = json.loads(line)
                    except Exception:
                        continue
                    if d.get("type") != "assistant":
                        continue
                    ts = d.get("timestamp")
                    if not ts:
                        continue
                    try:
                        ts_dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    except ValueError:
                        continue
                    if not (week_start_utc <= ts_dt <= week_end_utc):
                        continue
                    local_dt = ts_dt.astimezone()
                    if not (monday <= local_dt.date() <= sunday):
                        continue
                    weekday = local_dt.weekday()  # 0=Mon
                    hour = local_dt.hour
                    usage = (d.get("message") or {}).get("usage") or {}
                    grid[weekday][hour]["count"] += 1
                    grid[weekday][hour]["out_tokens"] += usage.get("output_tokens", 0) or 0
        except Exception:
            continue
    return {
        "timezone": datetime.now().astimezone().tzname(),
        "weekday_labels": WEEKDAY_LABELS,
        "cells": grid,
    }


def gh(*args):
    try:
        r = subprocess.run(["gh", *args], capture_output=True, text=True, timeout=30)
        if r.returncode != 0:
            return None
        return r.stdout
    except Exception:
        return None


def repo_visibility(repo):
    out = gh("api", f"repos/{GH_OWNER}/{repo}", "--jq", ".private")
    if out is None:
        return None
    return out.strip() != "true"  # True == public


def repo_releases(repo, monday, sunday, is_public):
    start, end = monday.isoformat(), (sunday + timedelta(days=1)).isoformat()
    prs_out = gh("pr", "list", "--repo", f"{GH_OWNER}/{repo}", "--state", "merged",
                 "--search", f"is:merged merged:{start}..{end}",
                 "--json", "number,title,mergedAt", "--limit", "50")
    try:
        prs = json.loads(prs_out) if prs_out else []
    except Exception:
        prs = []

    releases_out = gh("api", f"repos/{GH_OWNER}/{repo}/releases", "--jq",
                       ".[] | select(.published_at >= \"%sT00:00:00Z\" and .published_at < \"%sT00:00:00Z\") | {tag: .tag_name, name: .name, published_at: .published_at}" % (start, end))
    releases = []
    if releases_out:
        for line in releases_out.strip().splitlines():
            try:
                releases.append(json.loads(line))
            except Exception:
                continue

    if is_public:
        return {
            "pr_merge_count": len(prs),
            "pr_titles": [p["title"] for p in prs],
            "release_count": len(releases),
            "release_tags": [r["tag"] for r in releases],
        }
    # Private repo: counts only, no titles/tags — same rule as the site's
    # own project cards (PROJECTS.md: "curated status only, never internals").
    return {
        "pr_merge_count": len(prs),
        "pr_titles": None,
        "release_count": len(releases),
        "release_tags": None,
    }


def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    year, week, monday, sunday = target_week(arg)
    week_id = f"{year}-W{week:02d}"
    print(f"[weekly_stats] target week: {week_id} ({monday} -> {sunday})")

    files = glob.glob(os.path.join(ps.ROOT, "**", "*.jsonl"), recursive=True)
    sessions = []
    for path in files:
        dirname = os.path.basename(os.path.dirname(path))
        S = ps.parse_file(path, dirname)
        if S is None or (S["user_msgs"] == 0 and S["assistant_msgs"] == 0):
            continue
        sessions.append(S)

    repos = per_repo_rollup(sessions, monday, sunday)
    print(f"[weekly_stats] {len(repos)} repos with activity this week")

    heatmap = build_heatmap(monday, sunday)

    releases = {}
    for r in [x["repo"] for x in repos]:
        is_public = repo_visibility(r)
        if is_public is None:
            print(f"[weekly_stats] gh lookup failed for {r}, skipping release/PR data")
            continue
        releases[r] = repo_releases(r, monday, sunday, is_public)

    out = {
        "week_id": week_id,
        "week_start": monday.isoformat(),
        "week_end": sunday.isoformat(),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "repos": repos,
        "heatmap": heatmap,
        "releases": releases,
        "highlights": None,  # filled by .claude/agents/weekly-highlights.md
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, f"{week_id}.json")
    with open(out_path, "w") as fh:
        json.dump(out, fh, indent=2)
        fh.write("\n")
    print(f"[weekly_stats] wrote {out_path}")


if __name__ == "__main__":
    main()
