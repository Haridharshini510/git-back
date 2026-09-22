# GitBack — 3-Minute Demo Script

## Pre-Demo Setup (30 minutes before recording)

### 1. Prepare two terminal windows

- **Terminal A:** A real project repo with in-progress work — uncommitted changes, a feature branch, and a few TODOs in the code. If you don't have one, create a small Express/React project and leave it half-built on a branch like `feature/auth` or `feature/payments`.
- **Terminal B:** Same repo, for the "returning later" segment.

### 2. Seed realistic state

Make sure the repo has:

- A feature branch checked out (not `main`)
- 2-3 modified but uncommitted files
- A couple of TODO/FIXME comments in the changed files
- A few recent commits with meaningful messages

### 3. Pre-save checkpoints for the dashboard

Before recording, run `gitback_remember` in 2-3 different repos so your web dashboard already has project cards with different statuses (Active, Stalling, Dormant). The dashboard shouldn't look empty when you show it.

### 4. Have these windows ready (minimized)

1. Terminal with Claude Code open in the project
2. Browser with GitBack web dashboard loaded (projects visible)
3. (Optional) A code editor with the project open — for a quick visual of in-progress work

### 5. Test your setup

- Run `gitback_remember` and `gitback_resume` once to confirm MCP server and cloud are working
- Load the web dashboard and confirm it shows your projects
- Record at 1080p minimum (OBS, Loom, or built-in screen recorder)
- Set terminal font to **16-18pt** — judges watch on small screens

---

## The Demo

---

### ACT 1: The Problem (0:00 – 0:35)

**[SCREEN: Black screen or simple title slide: "GitBack"]**

**SAY:**

> "Let me tell you about the most expensive bug in software development. It's not a null pointer. It's not a race condition. It's this context loss"

**[SCREEN: Switch to terminal. Run `git log --oneline -5` so judges can see real commit history.]**

**SAY:**

> "You open a project you haven't touched in two weeks. You look at the branch name. You scroll through git log. You read your own code like a stranger wrote it. Thirty minutes later, you *maybe* remember what you were doing."

**[SCREEN: Run `git status` — show the uncommitted files sitting there.]**

**SAY:**

> "And your AI coding agent? It's brilliant. It can read every file, parse every diff. But ask it *'what was I trying to do?'* and it has no answer. Because it starts every session from scratch. It has no memory."

> "GitBack fixes that. It's a persistent development memory layer for coding agents. Let me show you."

**ACTIONS:**

- Run `git log --oneline -5` — pause 2 seconds
- Run `git status` — pause 2 seconds
- Speak with deliberate pace on "It has no memory" — let it land

---

### ACT 2: Saving Context — `gitback_remember` (0:35 – 1:15)

**[SCREEN: Claude Code terminal, in the project repo]**

**SAY:**

> "I'm in the middle of a project. I've got a feature branch, uncommitted changes, half-finished work. Normal Tuesday. Time to stop for the day."

> "Instead of hoping I'll remember all this tomorrow, I just say..."

**TYPE into Claude Code:**

```
Use gitback_remember — I'm halfway through implementing user authentication. 
The login endpoint works and returns a JWT. Refresh token rotation is stubbed 
out in auth/refresh.js. Next: finish rotation logic, then add auth middleware 
to protected routes. Don't touch the checkout UI yet.
```

**[SCREEN: Wait for GitBack's response — it shows the checkpoint confirmation with branch, commit, changed files, TODOs detected.]**

**SAY:**

> "That's it. GitBack captured my note — my intent — and automatically snapshotted everything around it. The branch, the commit, the changed files, the diffs, even the TODOs in my code. Five seconds."

**ACTIONS:**

- Type the message naturally — don't rush
- When the response appears, pause 3-4 seconds so judges can read it
- Point out key lines verbally: "See — it captured the changed files, the branch name, my exact words"

---

### ACT 3: Resuming Context — `gitback_resume` (1:15 – 2:10)

**[SCREEN: Same terminal]**

**SAY:**

> "Now let's simulate coming back. Maybe it's the next morning. Maybe it's two weeks later. Some commits have been made, the code has changed."

**ACTION: Make a quick visible change on camera:**

```
git commit --allow-empty -m "fix: resolve token expiry edge case"
```

*(Or commit a real staged change if you have one — looks more authentic.)*

**SAY:**

> "Now I'm back. I have no idea where I was. So I ask..."

**TYPE into Claude Code:**

```
Use gitback_resume to tell me where I left off
```

**[SCREEN: Wait for the AI-powered resume briefing. This is the hero moment — it shows "Where You Left Off," "What Changed," "What's Next," and "Evidence."]**

**SAY** *(read key parts from the output as they appear):*

> "It tells me exactly what I was doing — in my own words. What's changed since then. What I should do next. And look at this — every conclusion has evidence. It's not guessing. It cites my checkpoint, the git history, the diffs."

> "I went from zero context to productive in under ten seconds. No re-reading code. No scrolling git log. No guessing."

**ACTIONS:**

- This is the **money shot** — let the response fully render before speaking
- Pause on the evidence section — judges love "no hallucination" proven visually
- If the briefing is long, scroll slowly so it's readable on camera

---

### ACT 4: The Web Dashboard (2:10 – 2:40)

**[SCREEN: Switch to browser — GitBack web dashboard]**

**SAY:**

> "Everything GitBack captures is also available in a web dashboard."

**[SCREEN: Dashboard with 2-3 project cards showing status badges — Active, Stalling, Dormant.]**

**SAY:**

> "Every connected project, at a glance. Active, stalling, dormant — you can see which projects are losing momentum before you forget about them entirely."

**ACTION: Click into one of the project cards to open the Resume View.**

**[SCREEN: Resume View loads — sections for "Where You Left Off," files at checkpoint, TODOs, recent commits, evidence trail.]**

**SAY:**

> "Click in, and you get the full picture. Your last checkpoint — in your own words. The files you were touching. Your TODOs. The evidence trail. This is everything you need to jump back in."

**ACTIONS:**

- Scroll through the Resume View slowly — 1-2 seconds per section
- Don't rush — the visual design sells the product

---

### ACT 5: Architecture + Closing (2:40 – 3:00)

**[SCREEN: Stay on dashboard, or switch to an architecture slide if you have one.]**

**SAY:**

> "Under the hood — GitBack runs as a local MCP server that any coding agent can connect to. It collects git state deterministically — no AI for data collection. AI is only used for synthesis, through AWS Bedrock. Checkpoints persist to DynamoDB. The dashboard runs on S3 and CloudFront through API Gateway and Lambda. All serverless. All on AWS."

> "We've built AI tools that can understand code in seconds. But understanding code and understanding *intent* are different problems. One is stateless. The other requires memory."

**SAY** *(slower, deliberate):*

> "I didn't have to remember what I was doing. GitBack did."

**[SCREEN: Hold on dashboard or a closing "GitBack" title for 2-3 seconds. End recording.]**

---

## Timing Cheat Sheet

| Section | Start | End | Duration |
|---|---|---|---|
| ACT 1: The Problem | 0:00 | 0:35 | 35s |
| ACT 2: gitback_remember | 0:35 | 1:15 | 40s |
| ACT 3: gitback_resume | 1:15 | 2:10 | 55s |
| ACT 4: Web Dashboard | 2:10 | 2:40 | 30s |
| ACT 5: Architecture + Close | 2:40 | 3:00 | 20s |

---

## Emergency Contingencies

| If this happens... | Do this |
|---|---|
| `gitback_resume` takes too long (Bedrock latency) | Have a pre-recorded clip of the response ready to splice in. Or say "While that's synthesizing..." and switch to the dashboard. |
| Claude Code gives a weird response | Pre-test the exact prompts 3x before recording. Use the exact wording from this script. |
| Dashboard won't load | Screenshot fallback — take high-quality screenshots of the dashboard and Resume View beforehand, paste into slides. |
| You run over 3 minutes | Cut the architecture section to one sentence: "MCP server locally, DynamoDB and Bedrock on AWS, all serverless." Go straight to the closing line. |
| You run under 3 minutes | Add a `gitback_compare` demo between ACT 3 and ACT 4: "GitBack, what changed since my last checkpoint?" |

---

## Pro Tips

1. **Practice the closing line 5 times out loud.** "I didn't have to remember what I was doing. GitBack did." Slight pause before "GitBack did."
2. **Don't read from a script on camera.** Memorize the beats, not the words. Natural > polished.
3. **Use a real project.** Judges can smell fake demo data. Even a small project with real commits is 10x more convincing.
4. **Zoom your terminal font to 16-18pt.** If judges can't read the output, you lose them.
5. **Record in one take if you can.** A slightly imperfect single take feels more authentic than a splice-heavy edit.
