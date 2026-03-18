# SnipGeek Final Decision Document

Status: Final
Date: 2026-03-18
Scope: Brand statement, 3 content types, homepage block mapping

Implementation status (2026-03-18):

- Home Topics feed now prioritizes Windows+Ubuntu posts (no longer Windows-only).
- Home Updates feed now prioritizes Windows/Ubuntu update-relevant posts (no longer Android-centric).
- Topics and Updates "view all" routes now point to blog index for broader brand-consistent discovery.

## 1) Brand Statement (Locked)

Primary tagline:

Windows dan Ubuntu: Tutorial, Troubleshooting, dan Update Penting

Positioning:

SnipGeek is a practical Windows and Ubuntu publication. Content must prioritize real user outcomes over trend chasing, and should be directly actionable for daily users.

Editorial promise:

- Tutorial: clear steps users can execute safely
- Troubleshooting: practical diagnosis and fix paths
- Update Penting: relevant changes with impact context, not just announcements

## 2) Content System Rules (3 Types)

### A. Series (Step-by-Step)
Purpose:
Build structured learning paths (especially dual-boot and system workflows).

Mandatory input:

- key points (5-10 bullets)
- series phase
- article number
- target reader (from phase blueprint)
- tone hint (from phase blueprint)

Output expectations:

- full bilingual MDX (EN+ID) unless ID-only explicitly requested
- strong step order using Steps/Step components when procedural
- clear warnings, prerequisites, and verification checkpoints

Do:

- keep sequence logical and progressive
- include risk and rollback notes when relevant

Do not:

- skip prerequisites for installation/system changes
- write generic high-level advice without execution details

### B. News / Update
Purpose:
Turn external OS/news updates into SnipGeek-native practical analysis.

Mandatory input:

- 1 to 3 source URLs (required)
- SnipGeek angle (recommended, strongly encouraged)

Output expectations:

- extract important facts only
- explain practical impact for Windows/Ubuntu daily users
- include SnipGeek take (what matters, what to monitor, what to do now)

Do:

- cite source-derived facts accurately
- compare with prior behavior/version when useful

Do not:

- produce translation-like rewrites with no editorial perspective
- include unrelated rumor/speculation

### C. Tips & Tricks
Purpose:
Publish focused standalone fixes and productivity shortcuts.

Mandatory input:

- key points
- standalone context (why this tip is useful)

Output expectations:

- concise, practical, direct-to-action article
- minimal fluff, quick win orientation

Do:

- optimize for speed to value
- include short verification outcome

Do not:

- over-expand into long narrative if a short guide is enough

## 3) Homepage Block Mapping

Source: component structure in home client and home section components.

### Block 1 - Hero
Component: src/components/home/home-hero.tsx
Role:
Highlight flagship pieces that represent current editorial direction.
Feed rule:
Featured + published posts only.
Operational target:
At least 2 slots should reflect Windows/Ubuntu core focus at any time.

### Block 2 - Latest Posts
Component: src/components/home/home-latest.tsx
Role:
Show freshest published posts outside featured hero picks.
Feed rule:
Published posts excluding featured slugs.
Operational target:
Maintain healthy mix of tutorial, troubleshooting, and update intent.

### Block 3 - Tutorials Slider
Component: src/components/home/home-tutorials.tsx
Role:
Surface tutorial-heavy, stepwise content.
Feed rule:
Published posts where category equals Tutorial.
Operational target:
Use primarily Series outputs and high-value how-to posts.

### Block 4 - Topics Section
Component: src/components/home/home-topics.tsx
Role:
Deepen topical authority archive.
Feed rule:
Published posts tagged windows (current implementation).
Operational target:
Expand with balanced Windows and Ubuntu topical tracks in roadmap updates.

### Block 5 - Updates Slider
Component: src/components/home/home-updates.tsx
Role:
Deliver relevant system/software changes with practical impact.
Feed rule:
Published posts tagged android (current implementation).
Operational target:
Migrate focus toward Windows/Ubuntu update tags to match brand scope.

## 4) Execution Rules for Team/AI

Global:

- every draft must map to one content type before writing
- every output must be useful in real user scenarios
- avoid generic language and filler sections

Metadata:

- tags must be lowercase kebab-case
- minimum 3 tags, maximum 6 tags
- include 1 platform tag and 1 version tag when version-specific

Quality gate before publish:

- steps are testable
- troubleshooting paths have decision logic
- update posts contain impact analysis, not only summary

## 5) Immediate Next Adjustments (Operational)

- align updates slider feed from android-centric to Windows/Ubuntu update tags
- define phase blueprint file for Series to keep target/tone consistent
- maintain monthly review of homepage block balance (Tutorial vs Troubleshooting vs Update)
