# Design-Skill Auto-Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make design, UI, and motion requests automatically consult the correct design skill — without the user naming a skill — while never loading two design rulebooks that contradict each other.

**Architecture:** Two lanes. The *auto lane* is a `UserPromptSubmit` hook that keyword-matches design-shaped prompts and injects a one-line nudge toward a new `design-router` skill; the router owns all trigger phrases and dispatches to exactly one target skill. The *manual lane* is a `/design` slash command as an escape hatch. All routing config is global (`~/.claude`, `~/.agents`); the foundry repo receives only a stack-override subsection.

**Tech Stack:** Bash (hook + tests), `jq` (JSON payload parsing and settings edit — confirmed at `/usr/bin/jq`), Markdown with YAML frontmatter (skill, command, docs).

**Spec:** `docs/superpowers/specs/2026-07-26-design-skill-routing-design.md`

## Global Constraints

- All routing config lives **global**: `~/.agents/skills/design-router/`, `~/.claude/hooks/`, `~/.claude/commands/`, `~/.claude/settings.json`, `~/.claude/CLAUDE.md`. The only foundry change is one AGENTS.md subsection.
- **No edits to any upstream skill file.** Nothing under `~/.agents/skills/` may be created or modified except the new `design-router/` directory. Those skills are symlinked third-party content, clobbered on update.
- **The router body is dispatch-only, zero design content.** No font bans, no easing tables, no color rules. Target ≈70 lines.
- **The hook must exit 0 unconditionally** and must never block a turn, even on malformed stdin.
- Skill and command descriptions are **third person**, lead with triggering conditions ("Use when…"), and **never summarize the skill's workflow** — per `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.2.0/skills/writing-skills/SKILL.md:99-102`, a description that summarizes workflow causes agents to follow the description instead of reading the body.
- `~/.claude/settings.json` is live user config. Every task that touches it takes a timestamped backup first and validates the result parses as JSON before finishing.
- Commit after every task. Conventional commit format. Foundry-repo commits go on branch `docs/design-skill-routing`. Files outside the repo are not version-controlled here — the commit for those tasks records the repo-side artifact (plan checkbox updates) only.
- Commit footers, verbatim:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Md5Fd9uaVMmcyo6WvnG2Pb
  ```

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `~/.claude/hooks/design-nudge.sh` | Read prompt from stdin, keyword-match, emit nudge JSON or nothing | Create |
| `~/.claude/hooks/tests/test-design-nudge.sh` | Assertion suite for the hook — the only real test cycle in this plan | Create |
| `~/.claude/settings.json` | Register the hook under `hooks.UserPromptSubmit` | Modify |
| `~/.agents/skills/design-router/SKILL.md` | The routing table, exclusion sets, refactor split, stack gate | Create |
| `~/.claude/skills/design-router` | Symlink → the above, matching the convention every other user skill uses | Create |
| `~/.claude/commands/design.md` | Manual escape hatch; prints table or forces a route | Create |
| `~/.claude/CLAUDE.md` | Six-line pointer at the router. No duplicated table. | Modify |
| `foundry/AGENTS.md` | Repo stack overrides under "Design → build model routing" | Modify |
| `foundry/.scratch/design-skill-routing-test-checklist.html` | Interactive checklist for the 10-probe acceptance gate (fresh sessions required, so it cannot be automated) | Create |

---

## Task 1: The nudge hook

**Files:**
- Create: `~/.claude/hooks/design-nudge.sh`
- Test: `~/.claude/hooks/tests/test-design-nudge.sh`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: an executable at `~/.claude/hooks/design-nudge.sh` that reads a Claude Code `UserPromptSubmit` payload on stdin and writes either nothing or a JSON object of shape `{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"<string>"}}` to stdout. Task 2 registers this exact path.

**Design notes for the implementer:**

Matching uses a **leading word boundary only, no trailing boundary** — every keyword is treated as a prefix. `animat` therefore catches animate/animation/animated/animating with one entry, and `accessib` catches accessibility. The cost of a false positive is ~15 tokens of injected text plus the router's own refactor split routing the request back out; the cost of a missed trigger is the whole feature failing silently. Prefixes are the correct tradeoff here. The leading boundary `(^|[^[:alnum:]])` is what keeps `ui` from matching inside `guidance` or `build`.

Write `(^|[^[:alnum:]])` rather than `\b` — BSD `grep` on macOS does not support `\b` in `-E` mode reliably.

- [x] **Step 1: Write the failing test**

Create `~/.claude/hooks/tests/test-design-nudge.sh`:

```bash
#!/usr/bin/env bash
# Assertion suite for design-nudge.sh (UserPromptSubmit hook).
# Run: bash ~/.claude/hooks/tests/test-design-nudge.sh
set -uo pipefail

HOOK="$HOME/.claude/hooks/design-nudge.sh"
PASS=0
FAIL=0

# Feed a prompt string to the hook as a UserPromptSubmit payload; echo stdout.
run_hook() {
  printf '%s' "$1" | jq -Rn --rawfile _unused /dev/null \
    '{hook_event_name:"UserPromptSubmit", prompt:input}' 2>/dev/null \
    | bash "$HOOK"
}

# Simpler, dependency-light payload builder used by every test.
payload() {
  jq -n --arg p "$1" '{hook_event_name:"UserPromptSubmit", prompt:$p}'
}

assert_fires() {
  local desc="$1" prompt="$2" out
  out="$(payload "$prompt" | bash "$HOOK")"
  if printf '%s' "$out" | grep -q 'design-router'; then
    PASS=$((PASS+1)); echo "ok   - $desc"
  else
    FAIL=$((FAIL+1)); echo "FAIL - $desc (expected a nudge, got: '${out}')"
  fi
}

assert_silent() {
  local desc="$1" prompt="$2" out
  out="$(payload "$prompt" | bash "$HOOK")"
  if [ -z "$out" ]; then
    PASS=$((PASS+1)); echo "ok   - $desc"
  else
    FAIL=$((FAIL+1)); echo "FAIL - $desc (expected no output, got: '${out}')"
  fi
}

assert_exit_zero() {
  local desc="$1" stdin_data="$2"
  printf '%s' "$stdin_data" | bash "$HOOK" >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    PASS=$((PASS+1)); echo "ok   - $desc"
  else
    FAIL=$((FAIL+1)); echo "FAIL - $desc (non-zero exit)"
  fi
}

echo "== fires on design-shaped prompts =="
assert_fires "plain design verb"        "redesign the projects page"
assert_fires "feel/premium phrasing"    "make the hero feel more premium"
assert_fires "motion verb"              "add a hover animation to the cards"
assert_fires "typography noun"          "fix the typography hierarchy"
assert_fires "case insensitive"         "REDESIGN THE LANDING PAGE"
assert_fires "prefix match on animat"   "the animations are janky"
assert_fires "prefix match on accessib" "check this for accessibility issues"
assert_fires "refactor is in scope"     "refactor the harness page CSS"

echo "== stays silent on non-design prompts =="
assert_silent "plain bug fix"           "fix the failing unit test in parser.ts"
assert_silent "no keyword at all"       "what time does the build finish"
assert_silent "ui inside another word"  "read the guidance doc and summarize it"
assert_silent "empty prompt"            ""

echo "== never breaks the turn =="
assert_exit_zero "malformed json stdin" "this is not json at all"
assert_exit_zero "empty stdin"          ""
assert_exit_zero "valid design payload" "$(payload 'redesign the page')"

echo "== output is valid JSON when it fires =="
OUT="$(payload 'redesign the page' | bash "$HOOK")"
if printf '%s' "$OUT" | jq -e '.hookSpecificOutput.hookEventName == "UserPromptSubmit"' >/dev/null 2>&1; then
  PASS=$((PASS+1)); echo "ok   - emits well-formed hookSpecificOutput"
else
  FAIL=$((FAIL+1)); echo "FAIL - emits well-formed hookSpecificOutput (got: '${OUT}')"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[ "$FAIL" -eq 0 ]
```

Delete the unused `run_hook` helper before committing — `payload` is the one the assertions use. It is listed above only so you recognize it if you see it in a draft; do not ship dead code.

- [x] **Step 2: Run the test to verify it fails**

```bash
bash ~/.claude/hooks/tests/test-design-nudge.sh
```

Expected: every assertion fails, because `~/.claude/hooks/design-nudge.sh` does not exist yet. `bash` will report `No such file or directory` per invocation and the final line will show `failed:` greater than zero.

- [x] **Step 3: Write the minimal implementation**

Create `~/.claude/hooks/design-nudge.sh`:

```bash
#!/usr/bin/env bash
# UserPromptSubmit hook — nudges toward the design-router skill on design-shaped
# prompts. Advisory only: it injects one line of context and never blocks a turn.
#
# Keywords are matched as PREFIXES with a leading word boundary only, so `animat`
# covers animate/animation/animated and `accessib` covers accessibility. The
# leading boundary is what stops `ui` matching inside `guidance`. `\b` is avoided
# because BSD grep -E on macOS does not support it reliably.
set -uo pipefail

PAYLOAD="$(cat)"

PROMPT="$(printf '%s' "$PAYLOAD" | jq -r '.prompt // empty' 2>/dev/null || true)"
[ -z "$PROMPT" ] && exit 0

KEYWORDS='design|redesign|restyl|style|ui|ux|visual|look|feel|polish|premium|generic|slop|layout|spacing|typograph|font|color|colour|theme|token|animat|motion|transition|gestur|spring|drag|swipe|hover|scroll|component|hero|landing page|responsive|mobile|a11y|accessib|contrast|refactor'

NUDGE='Design/UI-shaped request detected. Consult the `design-router` skill before choosing an approach — it resolves which design skills apply, which cannot auto-fire, and which are mutually exclusive.'

if printf '%s' "$PROMPT" | grep -qiE "(^|[^[:alnum:]])($KEYWORDS)"; then
  jq -n --arg ctx "$NUDGE" \
    '{hookSpecificOutput:{hookEventName:"UserPromptSubmit", additionalContext:$ctx}}'
fi

exit 0
```

Then make it executable:

```bash
chmod +x ~/.claude/hooks/design-nudge.sh
```

- [x] **Step 4: Run the test to verify it passes**

```bash
bash ~/.claude/hooks/tests/test-design-nudge.sh
```

Expected: `failed: 0` and exit status 0.

If `ui inside another word` fails, the leading boundary group is wrong — check for a stray `?` or a missing `^` inside the bracket expression. If `empty prompt` fails, the `jq -r '.prompt // empty'` fallback is not returning an empty string; confirm the `-r` flag is present.

- [x] **Step 5: Commit**

The hook lives outside the repo and is not version-controlled here. Record progress by checking off Task 1's steps in the plan and committing that:

```bash
cd /Users/abhijitbansal/projects/foundry
git add docs/superpowers/plans/2026-07-26-design-skill-routing.md
git commit -F - <<'EOF'
chore: add design-nudge UserPromptSubmit hook

Keyword-matches design/UI/motion-shaped prompts and injects a one-line
nudge toward the design-router skill. Advisory only — exits 0
unconditionally and never blocks a turn.

Keywords match as prefixes with a leading word boundary only, so `animat`
covers animate/animation/animated. Uses (^|[^[:alnum:]]) rather than \b
because BSD grep -E on macOS does not support \b reliably.

Ships with an assertion suite at ~/.claude/hooks/tests/test-design-nudge.sh
covering firing, silence, malformed stdin, and output well-formedness.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Md5Fd9uaVMmcyo6WvnG2Pb
EOF
```

---

## Task 2: Register the hook in settings.json

**Files:**
- Modify: `~/.claude/settings.json`

**Interfaces:**
- Consumes: the executable at `~/.claude/hooks/design-nudge.sh` from Task 1.
- Produces: a `hooks.UserPromptSubmit` array in settings.json containing one command entry invoking that path. No later task depends on this beyond the acceptance gate.

**Design notes for the implementer:**

Current state, verified: `.hooks` has exactly the keys `["PreToolUse","SessionStart"]`, and `.hooks.UserPromptSubmit` is absent. Both PreToolUse slots are occupied (`bash-guard.sh` and the cartoon rewrite) — do not touch them.

`UserPromptSubmit` entries have no tool to match against, so omit the `matcher` field entirely.

The edit must be **idempotent**: re-running it must not append a duplicate entry. Guard on whether any registered command already mentions `design-nudge`.

This file is live user config. A corrupt settings.json breaks every future session, so the write goes to a temp file and only replaces the original after `jq` has parsed it successfully.

- [ ] **Step 1: Back up the current settings**

```bash
cp ~/.claude/settings.json ~/.claude/settings.json.bak-$(date +%Y%m%d-%H%M%S)
ls -1 ~/.claude/settings.json.bak-*
```

Expected: at least one backup file listed. Note its name — Step 4 restores from it if validation fails.

- [ ] **Step 2: Write the failing check**

```bash
jq -e '[.hooks.UserPromptSubmit[]?.hooks[]?.command] | any(test("design-nudge"))' ~/.claude/settings.json
```

Expected: exits non-zero (prints `false` or `null`) because the hook is not registered yet.

- [ ] **Step 3: Add the hook entry idempotently**

```bash
jq '.hooks.UserPromptSubmit =
      ( (.hooks.UserPromptSubmit // [])
        | if ([.[]?.hooks[]?.command] | any(test("design-nudge")))
          then .
          else . + [{
            "hooks": [{
              "type": "command",
              "command": "bash /Users/abhijitbansal/.claude/hooks/design-nudge.sh",
              "timeout": 5
            }]
          }]
          end )' \
  ~/.claude/settings.json > /tmp/settings.json.new
```

- [ ] **Step 4: Validate before replacing, then replace**

```bash
jq -e 'has("hooks") and (.hooks | has("PreToolUse") and has("SessionStart") and has("UserPromptSubmit"))' /tmp/settings.json.new \
  && mv /tmp/settings.json.new ~/.claude/settings.json \
  && echo "settings.json updated"
```

Expected: prints `true` then `settings.json updated`.

If the validation fails, do **not** move the file. Restore with `cp ~/.claude/settings.json.bak-<timestamp> ~/.claude/settings.json` and stop — a malformed settings.json breaks every future session.

- [ ] **Step 5: Run the check to verify it now passes, and confirm nothing else was lost**

```bash
jq -e '[.hooks.UserPromptSubmit[]?.hooks[]?.command] | any(test("design-nudge"))' ~/.claude/settings.json
jq -c '.hooks | keys' ~/.claude/settings.json
jq -c '[(.hooks.PreToolUse|length), (.hooks.SessionStart|length)]' ~/.claude/settings.json
```

Expected: `true`, then `["PreToolUse","SessionStart","UserPromptSubmit"]`, then `[2,2]`.

- [ ] **Step 6: Verify idempotency**

Re-run the Step 3 and Step 4 commands verbatim, then:

```bash
jq -c '.hooks.UserPromptSubmit | length' ~/.claude/settings.json
```

Expected: `1`. If it prints `2`, the guard in the `if` condition is not matching — check that `[.[]?.hooks[]?.command]` is inside the `//[]` fallback pipeline, not applied to the whole document.

- [ ] **Step 7: Commit**

```bash
cd /Users/abhijitbansal/projects/foundry
git add docs/superpowers/plans/2026-07-26-design-skill-routing.md
git commit -F - <<'EOF'
chore: register design-nudge as a UserPromptSubmit hook

Adds hooks.UserPromptSubmit to ~/.claude/settings.json. The slot was
previously unused; both PreToolUse slots (bash-guard, cartoon rewrite)
and both SessionStart hooks are untouched.

The jq edit is idempotent — it no-ops if any registered command already
mentions design-nudge — and writes to a temp file that is validated
before replacing the live config.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Md5Fd9uaVMmcyo6WvnG2Pb
EOF
```

---

## Task 3: The design-router skill

**Files:**
- Create: `~/.agents/skills/design-router/SKILL.md`
- Create: `~/.claude/skills/design-router` (symlink)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: a model-invocable skill named `design-router`. Task 4's command and Task 5's CLAUDE.md section both reference it by that exact name. It must **not** carry `disable-model-invocation`.

**Design notes for the implementer:**

Every other user skill is a symlink from `~/.claude/skills/<name>` into `~/.agents/skills/<name>`. Follow that convention exactly — create the real directory under `~/.agents/skills/` and symlink it.

The description below is load-bearing and must be copied **verbatim**. It is the only thing in context that decides whether this skill fires.

Do not add design content to the body. The contract is dispatch-only.

- [x] **Step 1: Write the failing structural check**

```bash
test -f ~/.agents/skills/design-router/SKILL.md \
  && test -L ~/.claude/skills/design-router \
  && echo "present" || echo "absent"
```

Expected: `absent`.

- [x] **Step 2: Create the skill file**

```bash
mkdir -p ~/.agents/skills/design-router
```

Write `~/.agents/skills/design-router/SKILL.md`:

````markdown
---
name: design-router
description: Use when a request concerns how something looks, feels, or moves — designing, redesigning, restyling, polishing, critiquing, or auditing a UI; making a page feel premium, less generic, bolder, or quieter; layout, spacing, typography, color, theming, or design tokens; adding, fixing, or reviewing animation, motion, transitions, gestures, springs, or drag; naming a motion effect; picking a frontend library; or refactoring code whose purpose is presentation (CSS, styles, components, markup). Also use when unsure whether a design skill applies.
---

# Design router

Dispatch only. This skill holds no design content — no font bans, no easing
tables, no color rules. Those live in the skills it routes to. If you want to
add a design opinion here, it belongs in a routed skill instead.

## How to use this

1. Classify the request against the routing table.
2. Apply the refactor split and the stack gate where they bite.
3. Call `Skill(<target>)` yourself. Never load two skills from the same
   exclusion set in one request.

## Routing table

| Request shape | Route to |
|---|---|
| New visual surface — page, landing, component | `impeccable:impeccable` (new-work / craft) |
| Redesign existing, "looks generic", "AI slop" | `redesign-existing-projects` |
| UX critique, a11y audit, visual hierarchy | `impeccable:impeccable` (critique / audit) |
| "What could be animated here", "feel more alive" | `find-animation-opportunities` |
| "Improve the animations", motion roadmap | `improve-animations` |
| Review a motion diff | `review-animations` |
| "What's it called when…" | `animation-vocabulary` |
| Gestures, springs, sheets, drag, momentum, iOS feel | `apple-design` |
| Component polish, "does this feel right" | `emil-design-eng` |
| Library pick — toasts, charts, cmdk, virtualization | `pick-ui-library` |
| Module / API shape, seams, testability | `codebase-design`, `design-an-interface` |

## Refactor split

`refactor` on its own is not a design verb, and it is the likeliest source of
wrong routing.

- Touching styling, layout, component structure, or markup (`.css`, `.tsx`,
  `.astro`, `.svelte`, style objects) → design lane, use the table above.
- Touching logic, data, build, or config → `codebase-design` or the
  `code-simplifier` agent. Stop here; no design skill applies.

The last row of the table is the same trap in reverse: `codebase-design` and
`design-an-interface` use "interface" to mean a module's API surface — types,
invariants, error modes — not UI.

## Stack gate

`design-taste-frontend` and `high-end-visual-design` assume React/Next plus
Tailwind utility classes. They are eligible only when the project's
`package.json` contains React (or Next) **and** Tailwind.

- Both eligible → prefer `design-taste-frontend` (broader, more detailed).
  `high-end-visual-design` is the shorter alternative for a premium-agency
  brief specifically.
- Not eligible → route to `impeccable:impeccable`,
  `redesign-existing-projects`, or `apple-design` instead.

The `and` is load-bearing. A project can carry React as a narrow dependency
without adopting the Tailwind idiom these two rulebooks are written against.

## Exclusion sets

Never load two members of the same set in one request.

1. `impeccable:impeccable` ⊗ `design-taste-frontend` ⊗ `high-end-visual-design`
   — three full rulebooks with contradicting font, color, layout, and motion
   bans. Pick exactly one.
2. `superpowers:brainstorming` ⊗ `impeccable:impeccable` — brainstorming owns
   "what should we build" and terminates at `writing-plans`; impeccable owns
   "make this look right" and runs its own gated pipeline. Two incompatible
   terminal states.
3. `emil-design-eng` ⊗ `review-animations` — near-duplicate content and the
   same mandatory Before/After/Why table. Motion diff → `review-animations`;
   everything else → `emil-design-eng`.

`full-output-enforcement` is domain-agnostic and overlaps nothing here. It
layers onto any route.

## Skills that cannot auto-fire

`review-animations` and `pick-ui-library` set `disable-model-invocation: true`.
They never trigger on their own — this router must call them by name.

If a `Skill` call fails to reach either of them, fall back to telling the user
to run `/design review-animations` or `/design pick-ui-library`. Do not
substitute a different skill.

## Preconditions

`impeccable:impeccable` restricts its tools to its own Node scripts and expects
a per-project copy at `.claude/skills/impeccable`. Before routing there, check
that directory exists; if it does not, tell the user to run `/impeccable init`
first.
````

- [x] **Step 3: Create the symlink**

```bash
ln -s ../../.agents/skills/design-router ~/.claude/skills/design-router
ls -la ~/.claude/skills/design-router
```

Expected: a symlink entry resolving to `../../.agents/skills/design-router`, matching the form of the neighbouring entries (`ls -la ~/.claude/skills/ | grep apple-design` shows the pattern).

- [x] **Step 4: Run the structural checks to verify they pass**

```bash
test -f ~/.agents/skills/design-router/SKILL.md && echo "skill file ok"
test -L ~/.claude/skills/design-router && echo "symlink ok"
test -f ~/.claude/skills/design-router/SKILL.md && echo "symlink resolves ok"
awk '/^---$/{n++; next} n==1' ~/.agents/skills/design-router/SKILL.md | grep -c 'disable-model-invocation'
awk '/^---$/{n++; next} n==1' ~/.agents/skills/design-router/SKILL.md | grep -c '^description: Use when'
```

Expected: `skill file ok`, `symlink ok`, `symlink resolves ok`, then `0` (the flag must be absent from the **frontmatter** so the skill is model-invocable), then `1`.

Both of the last two checks scope themselves to the frontmatter with `awk`. Do not grep the whole file for `disable-model-invocation` — the body mentions it once, in the "Skills that cannot auto-fire" section, describing `review-animations` and `pick-ui-library`. That mention is required content, not a violation: it is the exact frontmatter key a reader needs in order to verify the claim themselves. A whole-file grep returns `1` and false-flags a correct skill, which is why the check is frontmatter-scoped rather than the body being reworded to dodge it.

`grep -c` exits non-zero when the count is 0, so the fourth command prints `0` and returns 1 — that is the passing case here. Read the printed number, not the exit status.

- [x] **Step 5: Verify the body stayed dispatch-only**

```bash
wc -l ~/.agents/skills/design-router/SKILL.md
grep -icE 'font-family|cubic-bezier|#[0-9a-f]{6}|ease-out|rem;' ~/.agents/skills/design-router/SKILL.md
```

Expected: roughly 100 lines or fewer, and `0` design-content matches. A non-zero second number means design opinions leaked into the router — move them out.

- [x] **Step 6: Commit**

```bash
cd /Users/abhijitbansal/projects/foundry
git add docs/superpowers/plans/2026-07-26-design-skill-routing.md
git commit -F - <<'EOF'
feat: add design-router skill

Model-invocable router whose description carries every design trigger
phrase and whose body is a dispatch table only — no design content.

Covers the routing table, the refactor split (presentation vs logic),
the React+Tailwind stack gate for the taste rulebooks, three mutual
exclusion sets, and the two skills that set disable-model-invocation
and therefore must be called by name.

Created at ~/.agents/skills/design-router with a symlink from
~/.claude/skills/design-router, matching every other user skill.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Md5Fd9uaVMmcyo6WvnG2Pb
EOF
```

---

## Task 4: The /design command

**Files:**
- Create: `~/.claude/commands/design.md`

**Interfaces:**
- Consumes: the `design-router` skill name from Task 3.
- Produces: a `/design` slash command accepting an optional route argument. Task 5's CLAUDE.md text references it as the fallback for the two non-auto-firing skills.

**Design notes for the implementer:**

`~/.claude/commands/` currently holds exactly one file, `commit-push-pr.md`. Match its frontmatter conventions.

The command is the manual lane — a false-negative escape hatch, not the primary path. It must not restate the routing table inline; it loads the router, which owns it.

- [x] **Step 1: Write the failing check**

```bash
test -f ~/.claude/commands/design.md && echo "present" || echo "absent"
```

Expected: `absent`.

- [x] **Step 2: Create the command**

Write `~/.claude/commands/design.md`:

```markdown
---
description: Route a design, UI, or motion request to the right design skill.
argument-hint: [route]
---

Invoke the `design-router` skill.

If `$ARGUMENTS` is empty, classify the user's current request against the
router's table and dispatch to the single best target.

If `$ARGUMENTS` names a route or a skill (for example `pick-ui-library`,
`review-animations`, `animate`, `critique`), skip classification and dispatch
straight to it. This is the supported way to reach `review-animations` and
`pick-ui-library`, which set `disable-model-invocation: true` and cannot fire
on their own.

Respect the router's exclusion sets — never load two skills from the same set.
```

- [x] **Step 3: Run the check to verify it passes**

```bash
test -f ~/.claude/commands/design.md && echo "present"
head -4 ~/.claude/commands/design.md
```

Expected: `present`, then frontmatter showing the `description` and `argument-hint` lines.

- [x] **Step 4: Commit**

```bash
cd /Users/abhijitbansal/projects/foundry
git add docs/superpowers/plans/2026-07-26-design-skill-routing.md
git commit -F - <<'EOF'
feat: add /design slash command

Manual escape hatch for the design router. With no argument it classifies
the current request; with an argument it dispatches straight to a named
route. The argument form is the supported path to review-animations and
pick-ui-library, which cannot be model-invoked.

Deliberately does not restate the routing table — the router owns it, so
there is one source of truth to keep in sync.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Md5Fd9uaVMmcyo6WvnG2Pb
EOF
```

---

## Task 5: CLAUDE.md pointer

**Files:**
- Modify: `~/.claude/CLAUDE.md`

**Interfaces:**
- Consumes: the `design-router` skill name (Task 3) and the `/design` command (Task 4).
- Produces: no interface for later tasks.

**Design notes for the implementer:**

Six lines. The router is the single source of truth for the routing table — duplicating it here guarantees drift. State only the pointer, the refactor split, the exclusivity rule, and the two non-auto-firing skills.

Insert as a new top-level section. Place it immediately after the existing `## Subagent dispatch: right model, right effort` section, so design routing sits next to the other routing rules rather than at the end of the file.

Per `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.2.0/skills/using-superpowers/SKILL.md:62`, CLAUDE.md instructions outrank skills — so this text can direct skill choice, and it is worth keeping narrow for exactly that reason.

- [x] **Step 1: Write the failing check**

```bash
grep -c 'design-router' ~/.claude/CLAUDE.md
```

Expected: `0` (and a non-zero exit status, which is the passing state here — read the number).

- [x] **Step 2: Find the insertion point**

```bash
grep -n '^## ' ~/.claude/CLAUDE.md | head -20
```

Note the line number of the heading that follows `## Subagent dispatch: right model, right effort`. The new section goes immediately before that heading.

- [x] **Step 3: Insert the section**

Insert this text verbatim at that point:

```markdown
## Design work: route it, don't improvise

- Anything about how something **looks, feels, or moves** starts at the `design-router` skill — it picks the right design skill from the dozen installed and knows which ones contradict each other. `/design [route]` is the manual override.
- **`refactor` is not automatically a design verb.** Presentation code (CSS, styles, components, markup) goes to the design lane; logic, data, build, and config go to `codebase-design` or the `code-simplifier` agent.
- **Never load two design rulebooks at once.** `impeccable:impeccable`, `design-taste-frontend`, and `high-end-visual-design` are mutually exclusive, as are `superpowers:brainstorming` and `impeccable:impeccable`.
- **`review-animations` and `pick-ui-library` cannot auto-fire** (`disable-model-invocation: true`). Reach them via the router or `/design <name>`.
- The router holds the full routing table. Don't duplicate it here — one source of truth.
```

- [x] **Step 4: Run the check to verify it passes**

```bash
grep -c 'design-router' ~/.claude/CLAUDE.md
grep -n '^## Design work' ~/.claude/CLAUDE.md
```

Expected: a count of `2` or more, and the new heading located between the subagent-dispatch section and whatever followed it.

- [x] **Step 5: Verify nothing else was disturbed**

```bash
grep -c '^## ' ~/.claude/CLAUDE.md
grep -n 'graphify' ~/.claude/CLAUDE.md | head -3
```

Expected: the section count is exactly one higher than the Step 2 listing showed, and the graphify rule at the top of the file is intact.

- [x] **Step 6: Commit**

```bash
cd /Users/abhijitbansal/projects/foundry
git add docs/superpowers/plans/2026-07-26-design-skill-routing.md
git commit -F - <<'EOF'
docs: point CLAUDE.md at the design router

Six lines placed beside the existing subagent-dispatch routing rules:
start design work at design-router, split refactor by presentation vs
logic, never load two design rulebooks at once, and reach the two
disable-model-invocation skills explicitly.

Deliberately omits the routing table so the router stays the single
source of truth.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Md5Fd9uaVMmcyo6WvnG2Pb
EOF
```

---

## Task 6: foundry AGENTS.md stack overrides

**Files:**
- Modify: `/Users/abhijitbansal/projects/foundry/AGENTS.md`

**Interfaces:**
- Consumes: the stack gate and routing vocabulary from Task 3.
- Produces: no interface for later tasks.

**Design notes for the implementer:**

This goes as a **subsection appended to the existing `## Design → build model routing` section**, not as a new row in the Project decisions table — it is routing guidance, not a locked project decision.

Foundry carries React as a narrowly scoped dependency (one `client:visible` figure, per the Stack row's 2026-07-14 exception) but no Tailwind, so the router's `React AND Tailwind` gate already excludes the taste rulebooks here. Say so explicitly, because "foundry has React" would otherwise look like it satisfies the gate.

Do not touch the existing model-tier mapping (Fable designs, Sonnet builds) — it still applies on top of skill routing.

- [x] **Step 1: Write the failing check**

```bash
cd /Users/abhijitbansal/projects/foundry
grep -c 'design-router' AGENTS.md
```

Expected: `0`.

- [x] **Step 2: Locate the insertion point**

```bash
grep -n '^## ' AGENTS.md
```

The new subsection goes at the end of the `## Design → build model routing` section — immediately before the `## Orchestration modes` heading.

- [x] **Step 3: Insert the subsection**

Insert this text verbatim immediately before `## Orchestration modes`:

```markdown
### Which design skill applies here

Skill routing is global (`design-router`); this is what that router resolves to **in this repo**.

- UI here uses House DS `--ds-*` custom properties with inline styles — **no Tailwind, no CSS modules, no hardcoded color values**. Any skill that assumes utility classes is the wrong tool.
- **`design-taste-frontend` and `high-end-visual-design` are not eligible in this repo.** Both assume React/Next + Tailwind. Foundry carries React only as the narrowly scoped `RoutingCard.tsx` exception and has no Tailwind, so the router's `React AND Tailwind` gate correctly excludes them — React alone is not the signal.
- Sanctioned set here: `impeccable:impeccable`, `redesign-existing-projects`, `apple-design`, and the motion trio (`find-animation-opportunities`, `improve-animations`, `review-animations`).
- `impeccable:impeccable` needs `/impeccable init` run in this repo before its script-backed routes work.
- Skill routing composes with the model-tier routing above; it does not replace it. Design still runs at planner tier, implementation at executor tier.
```

- [x] **Step 4: Run the check to verify it passes**

```bash
grep -c 'design-router' AGENTS.md
grep -n '^### Which design skill applies here' AGENTS.md
grep -n '^## Orchestration modes' AGENTS.md
```

Expected: count `1` or more; the new subsection heading appears on a line immediately preceding the `## Orchestration modes` heading.

- [x] **Step 5: Verify the existing routing rules survived**

```bash
grep -c 'Fable designs; Sonnet builds' AGENTS.md
grep -c 'Current tier mapping' AGENTS.md
```

Expected: `1` for each.

- [x] **Step 6: Commit**

```bash
cd /Users/abhijitbansal/projects/foundry
git add AGENTS.md docs/superpowers/plans/2026-07-26-design-skill-routing.md
git commit -F - <<'EOF'
docs: record foundry's design-skill overrides in AGENTS.md

Appends a subsection to the existing design-routing section naming which
design skills apply in this repo: House DS tokens rather than utility
classes, taste rulebooks excluded because the router's React AND Tailwind
gate does not match here, and the sanctioned skill set.

Model-tier routing (Fable designs, Sonnet builds) is unchanged and still
composes on top.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Md5Fd9uaVMmcyo6WvnG2Pb
EOF
```

---

## Task 7: Acceptance-gate checklist

**Files:**
- Create: `/Users/abhijitbansal/projects/foundry/.scratch/design-skill-routing-test-checklist.html`

**Interfaces:**
- Consumes: the 10 probes from the spec's §6.
- Produces: the branch's manual-test deliverable. Nothing consumes it programmatically.

**Design notes for the implementer:**

The probes cannot be automated — each must run in a **fresh session**, because the skill listing and injected hook context are per-session. This is the branch's manual surface, so per the global rule it ships as an interactive HTML checklist.

Required mechanics: real checkboxes persisting to `localStorage` under a key namespaced to this branch (`design-skill-routing-v1`), a sticky progress bar with done/total, per-section tallies, a reset button, and a collapsible `<details open>` context section titled "What's in this branch".

Confirm `.scratch/` is gitignored before writing; if it is not, add it to `.gitignore` in this task.

The gate's pass condition is **8/10 overall AND probes 2, 9, 10 each passing individually**. Mark those three visibly as diagnostic in the HTML — a run that scores 8/10 by failing exactly those three is a failure. The checklist must make that impossible to misread.

Probe table to encode (prompt → expected route):

| # | Probe prompt | Expected | Diagnostic |
|---|---|---|---|
| 1 | make the hero feel more premium | router → `impeccable:impeccable` or `redesign-existing-projects` | |
| 2 | refactor works.ts | **no design skill** | yes |
| 3 | refactor the harness page CSS | design lane | |
| 4 | review this diff | no design skill unless the diff contains motion | |
| 5 | add a hover animation to the project cards | `find-animation-opportunities` | |
| 6 | the modal transition feels janky | `apple-design` or `emil-design-eng` | |
| 7 | what's it called when the sheet bounces at the top | `animation-vocabulary` | |
| 8 | redesign the projects page | `redesign-existing-projects` | |
| 9 | what should I use for toasts | `pick-ui-library` | yes |
| 10 | let's build a new case-study page | `superpowers:brainstorming`, not `impeccable` | yes |

"What's in this branch" section content: the design-nudge hook and its assertion suite, the settings.json registration, the design-router skill and symlink, the `/design` command, the CLAUDE.md pointer, and the foundry AGENTS.md overrides.

Failure guidance to include at the end: under-firing is fixed by widening the hook keyword set in `~/.claude/hooks/design-nudge.sh`, not by enlarging the router body; over-firing (probe 2 failing) is fixed by tightening the refactor split in the router, not by removing hook keywords. Probe 9 failing means a `Skill` call cannot reach a `disable-model-invocation` target — fall back to `/design pick-ui-library` and record it in the spec's §7 risk row.

- [ ] **Step 1: Confirm .scratch is gitignored**

```bash
cd /Users/abhijitbansal/projects/foundry
grep -n 'scratch' .gitignore || echo "NOT IGNORED"
```

If it prints `NOT IGNORED`, append `.scratch/` to `.gitignore` and include that file in this task's commit.

- [ ] **Step 2: Write the checklist**

Create `.scratch/design-skill-routing-test-checklist.html` implementing the mechanics and content above. Self-contained: inline CSS and JS, no external requests.

- [ ] **Step 3: Verify it works**

```bash
cd /Users/abhijitbansal/projects/foundry
test -f .scratch/design-skill-routing-test-checklist.html && echo "present"
grep -c 'localStorage' .scratch/design-skill-routing-test-checklist.html
grep -c 'design-skill-routing-v1' .scratch/design-skill-routing-test-checklist.html
grep -oE 'type="checkbox"' .scratch/design-skill-routing-test-checklist.html | wc -l
```

Expected: `present`; at least `2` localStorage references (read and write); at least `1` namespaced key; and a checkbox count of at least `10` (one per probe).

Then open it and confirm by hand that ticking a box, reloading, and pressing reset all behave.

- [ ] **Step 4: Commit**

```bash
cd /Users/abhijitbansal/projects/foundry
git add .gitignore docs/superpowers/plans/2026-07-26-design-skill-routing.md
git commit -F - <<'EOF'
docs: add acceptance-gate checklist for design-skill routing

Ten probes covering firing, non-firing, the refactor split, the two
disable-model-invocation skills, and the brainstorming/impeccable
precedence. Each must run in a fresh session, so the gate is manual by
necessity.

Pass condition is 8/10 overall AND probes 2, 9, 10 each passing — those
three are diagnostic, and a run that scores 8/10 by failing exactly them
is a failure, not a pass.

Checklist itself lives in gitignored .scratch/ per repo convention.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Md5Fd9uaVMmcyo6WvnG2Pb
EOF
```

---

## Self-review notes

**Spec coverage.** §4.1 router → Task 3. §4.2 hook → Tasks 1–2. §4.3 command → Task 4. §4.4 CLAUDE.md → Task 5. §4.5 AGENTS.md → Task 6. §6 acceptance gate → Task 7. §5 out-of-scope items are enforced by the Global Constraints block (no upstream edits, no mandate, no consolidation, no impeccable hook changes). §2.4's impeccable-hooks decision and §7's risk rows need no implementation — they are recorded decisions.

**Naming consistency.** The skill is `design-router` in every task, file, symlink, command body, CLAUDE.md text, and AGENTS.md text. The hook is `design-nudge.sh` in Task 1's creation, Task 2's registration and idempotency guard, and Task 7's failure guidance. The localStorage key `design-skill-routing-v1` appears in Task 7's notes and its own verification step.

**Known limitation carried from the spec.** Whether `Skill(review-animations)` from inside the router reaches a `disable-model-invocation` target is untested. Probe 9 is the test; the router's own "Skills that cannot auto-fire" section states the `/design <name>` fallback. No task can resolve this ahead of the gate.
