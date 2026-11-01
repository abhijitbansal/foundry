# Weekly job: setup and moving machines

Every Monday at 09:00 one launchd job refreshes two repos from this machine's Claude Code history:

- **foundry** (this site): stats, the week's digest and the yard. It opens a PR that auto-merges once CI passes.
- **abhijitbansal** (the GitHub profile README): telemetry SVGs, pushed straight to `main`.

This page covers setup and moving to another Mac. For what each stage does, see [`docs/automation/weekly-pipeline.md`](../../docs/automation/weekly-pipeline.md).

No secrets live in either repo. Everything authenticates through logins that already exist on the machine: an SSH key, `gh` and `claude`.

## How it works

```
launchd (Mon 09:00)
  └─ caffeinate -i zsh -lc …              # keeps the Mac awake for the run
       ├─ clone/reset ~/projects/foundry-weekly to origin/main
       └─ scripts/weekly/run_weekly.sh
            1. parse_sessions.py   ~/.claude/projects → data/stats.json (+ archive)
            2. weekly_stats.py     → data/weekly/<week>.json
            3. claude -p           writes the week's highlight sentences
            4. npm ci, build, test
            5. branch weekly-digest-<week> → PR → auto-merge on green CI
            6. ~/projects/abhijitbansal-weekly: regenerate SVGs → push main
            7. notify (push notification + macOS banner)
```

- The job runs in two clones of its own, `~/projects/foundry-weekly` and `~/projects/abhijitbansal-weekly`. It never touches your working checkouts.
- Each run hard-resets both clones to `origin/main`, so a failed run cleans itself up next time.
- The job always runs the latest `run_weekly.sh` on `main`. Merging a script change is enough; there is nothing to reinstall.
- **All numbers come from the Claude Code transcripts in `~/.claude/projects` on the machine running the job.** A session counts for a repo only if it ran inside `~/projects/<repo>`.

## Prerequisites

| Need | Check | Notes |
|---|---|---|
| Git + SSH key that can push to both repos | `ssh -T git@github.com` | Add the key to the keychain so launchd can use it: `ssh-add --apple-use-keychain ~/.ssh/<key>` |
| GitHub CLI, logged in | `gh auth status` | Opens PRs, queues auto-merge, reads languages and contributions |
| Claude Code CLI, logged in | `claude -p "say ok"` | Uses your subscription login. No API key |
| Node 22+ and npm | `node -v` | CI uses Node 22 |
| Python 3 (stdlib only) | `python3 --version` | |
| These on the **login-shell** PATH | `zsh -lc 'which git gh claude node python3'` | launchd runs `zsh -lc`, so PATH comes from `~/.zprofile`. Put Homebrew's `shellenv` line there, not only in `~/.zshrc` |

Repo settings this relies on (already set on foundry): branch protection on `main` that requires the `build-and-test` check, plus "Allow auto-merge".

## Install

```sh
git clone git@github.com:abhijitbansal/foundry.git ~/projects/foundry-weekly

# 1. Dry run: every stage runs, but nothing is committed or pushed
DRY_RUN=true ~/projects/foundry-weekly/scripts/weekly/run_weekly.sh

# 2. Install the schedule
cp ~/projects/foundry-weekly/scripts/weekly/com.abhijitbansal.foundry-weekly.plist.template \
   ~/Library/LaunchAgents/com.abhijitbansal.foundry-weekly.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.abhijitbansal.foundry-weekly.plist

# 3. Optional: run it for real now instead of waiting for Monday
launchctl kickstart -k gui/$(id -u)/com.abhijitbansal.foundry-weekly
```

The job clones `~/projects/abhijitbansal-weekly` on its first run.

**Backfill a missed week** (on any day except Monday, pass the week id explicitly):

```sh
~/projects/foundry-weekly/scripts/weekly/run_weekly.sh 2026-W43
```

**Uninstall:** `launchctl bootout gui/$(id -u)/com.abhijitbansal.foundry-weekly`, then delete the plist.

## Where to look when it fails

- Per-run logs (last 20): `~/projects/foundry-weekly-logs/run-*.log`. The `ERROR … at line N` line names the failing step.
- launchd's own output: `/tmp/com.abhijitbansal.foundry-weekly.{out,err}.log`
- Is it loaded? `launchctl print gui/$(id -u)/com.abhijitbansal.foundry-weekly`

A digest PR that never merges is usually a build failure, not a bug in the job. These need a person:

| Symptom | Fix |
|---|---|
| CI fails: `no YARD layout slot for repo(s): …` | A repo in `PROJECTS_ALLOWLIST` gained activity. Add its `YARD` slot in `src/lib/works-layout.ts` (see AGENTS.md → Telemetry data) |
| Log warns: `isn't in DISCLOSED_REPOS — excluded from the public chart` | The profile README only charts repos in `DISCLOSED_REPOS` (`scripts/generate-telemetry.mjs` in the abhijitbansal repo). Add it there on purpose, or leave it out |
| `git push` rejected, branch exists | Delete the stale `weekly-digest-<week>` branch on GitHub and rerun |

## Moving to the Mac mini

Telemetry follows transcripts, and transcripts stay on the Mac where each Claude Code session ran. Moving the job is easy. Keeping the numbers complete takes one decision.

1. **Choose where the numbers come from.**
   - *You code on the mini* (directly or remotely): nothing to do.
   - *You keep coding on the laptop*: copy the laptop's transcripts to the mini before Monday 09:00, for example on a Sunday-night schedule on the laptop:
     ```sh
     rsync -a ~/.claude/projects/ mini.local:~/.claude/projects/
     ```
     Session files have unique names, so copying them never double-counts. Use `-a` without `--delete`, so files Claude Code has purged on one Mac are not removed from the other.
   - *Neither*: past numbers stay (the archive only ever grows), but new activity stops appearing.
2. **Keep repo paths the same:** work in `~/projects/<repo>` on both Macs. The username can differ.
3. Set up the [prerequisites](#prerequisites) on the mini and log in to `gh` and `claude` there.
4. [Install](#install) on the mini and do the dry run.
5. **Uninstall from the laptop** once the mini's first real run succeeds. Two Macs running the job race on the same `weekly-digest-<week>` branch.
6. The mini's timezone sets "Monday 09:00". launchd has no per-job timezone.
7. Optional: the macOS banner needs a logged-in GUI session. On a headless mini it fails quietly; the push notification and the logs still work.

Nothing else carries over. The clones, logs and archive are rebuilt or already live in git (`data/stats-archive.json`).
