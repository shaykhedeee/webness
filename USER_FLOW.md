# WEBNESS OS: Complete User Flow & UX Specification
**Date:** February 9, 2026  
**Purpose:** Every screen, every click, every animation. The AI coder must follow this exactly.

---

## 1. The User Journey Map

```
                    ┌─────────────────────┐
                    │   DISCOVERY          │
                    │   (Landing Page)     │
                    │   "Free SEO Audit"   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   FREE AUDIT         │
                    │   (No signup needed) │
                    │   Paste URL → Score  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   THE HOOK           │
                    │   "Score: 47/100"    │
                    │   "Sign up to fix    │
                    │    these issues →"   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   SIGNUP             │
                    │   Email + Password   │
                    │   OR Google OAuth    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   ONBOARDING WIZARD  │
                    │   (3-5 fun steps)    │
                    │   Shape question!    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   DASHBOARD          │
                    │   (Command Center)   │
                    │   500 free credits   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   FIRST TOOL USE     │
                    │   (Guided tutorial)  │
                    │   "Try Blog Writer"  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   THE GLASS FACTORY  │
                    │   (Watch AI work)    │
                    │   SSE Live Streaming │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   RESULT             │
                    │   View/Download/     │
                    │   Publish/Share      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   RETENTION LOOP     │
                    │   Achievements       │
                    │   Streaks            │
                    │   Re-engagement      │
                    └─────────────────────┘
```

---

## 2. Screen-by-Screen Specification

### SCREEN 1: Landing Page (webness.in)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Logo]  Tools  Pricing  About  [Login] [Get Started]│
├─────────────────────────────────────────────────────┤
│                                                       │
│   "Your AI Business Growth Engine"                    │
│   "Content. SEO. Leads. Support. All automated."      │
│                                                       │
│   ┌─────────────────────────────────────┐            │
│   │  🔍 Paste your website URL here...   │  [AUDIT]  │
│   └─────────────────────────────────────┘            │
│   "Free instant SEO audit. No signup required."      │
│                                                       │
├─────────────────────────────────────────────────────┤
│  "Watch the AI Work" (Embedded demo video/GIF)       │
│  ┌────────────────────────────────────────────┐     │
│  │  [Animated GIF showing the Glass Factory   │     │
│  │   LiveView with AI generating a blog post] │     │
│  └────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────┤
│  TOOL SHOWCASE                                       │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │ SEO  │  │ Blog │  │ Social│  │ Lead │           │
│  │Audit │  │Writer│  │Writer │  │Scrape│           │
│  │ FREE │  │ 15cr │  │ 5cr  │  │ 20cr │           │
│  └──────┘  └──────┘  └──────┘  └──────┘           │
├─────────────────────────────────────────────────────┤
│  PRICING                                             │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐           │
│  │ Starter │  │  Pro    │  │Enterprise│           │
│  │ $49/mo  │  │ $149/mo │  │ $399/mo  │           │
│  │ 500 cr  │  │ 2000 cr │  │ 10000 cr │           │
│  └─────────┘  └─────────┘  └──────────┘           │
├─────────────────────────────────────────────────────┤
│  INDUSTRY PAGES                                      │
│  "Webness for Interior Designers"                    │
│  "Webness for Clinics"                               │
│  "Webness for Shopify Stores"                        │
│  "Webness for Restaurants"                           │
├─────────────────────────────────────────────────────┤
│  SOCIAL PROOF / TESTIMONIALS                         │
│  [Client logos]  [Quote cards]  [Case study links]  │
└─────────────────────────────────────────────────────┘
```

**Key Interaction:**
- User pastes URL in the hero input → Instant redirect to Audit page (no signup!)
- The free audit is the funnel entry point. Hook them with fear (low score), sell the cure.

---

### SCREEN 2: Free SEO Audit (No Auth Required)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Logo]                            [Sign up to save] │
├─────────────────────────────────────────────────────┤
│                                                       │
│  "Auditing: https://example.com"                     │
│                                                       │
│  ┌───────────────────────────────────────────┐       │
│  │  🔍 Crawling website...              ✅    │       │
│  │  📊 Analyzing technical SEO...       ✅    │       │
│  │  📝 Checking content quality...      ⏳    │       │
│  │  🔗 Evaluating link structure...     ⬜    │       │
│  │  🏆 Comparing with competitors...   ⬜    │       │
│  │  📋 Generating recommendations...   ⬜    │       │
│  └───────────────────────────────────────────┘       │
│                                                       │
│  ┌─ LIVE TERMINAL ─────────────────────────┐        │
│  │  > Fetching https://example.com...       │        │
│  │  > Page loaded in 3.2s (needs improvement)│       │
│  │  > Found 2 H1 tags (should be 1)        │        │
│  │  > Missing meta description!             │        │
│  │  > Schema markup: Not found              │        │
│  │  > Analyzing competitor: competitor1.com  │        │
│  │  > ...                                   │        │
│  └──────────────────────────────────────────┘        │
│                                                       │
│  (After completion:)                                  │
│                                                       │
│  ┌─ YOUR SCORE ────────────────────────────┐        │
│  │           ┌──────────┐                   │        │
│  │           │    47    │   / 100           │        │
│  │           │  NEEDS   │                   │        │
│  │           │   WORK   │                   │        │
│  │           └──────────┘                   │        │
│  │                                          │        │
│  │  Technical: 52/100                       │        │
│  │  Content:   38/100                       │        │
│  │  Links:     55/100                       │        │
│  │  Speed:     43/100                       │        │
│  └──────────────────────────────────────────┘        │
│                                                       │
│  TOP 3 ISSUES (shown free):                          │
│  1. ❌ Missing meta description                      │
│  2. ❌ No schema markup detected                     │
│  3. ❌ Page load time: 3.2s (should be < 2s)        │
│                                                       │
│  ┌─────────────────────────────────────────┐        │
│  │  🔒 Sign up to see full report +        │        │
│  │     AI-generated fix strategy            │        │
│  │     [CREATE FREE ACCOUNT]                │        │
│  └─────────────────────────────────────────┘        │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Key Interactions:**
- Steps animate in real-time via SSE (not fake loading bars!)
- Terminal shows actual crawl/analysis activity
- Score is revealed with animation (counter rolls up from 0 to final score)
- Only top 3 issues shown free. Full report = signup required
- "Sign up to save" button in header catches users who try to leave

---

### SCREEN 3: Onboarding Wizard (Post-Signup)

**Step 1: "Tell us about your business"**
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│   Step 1 of 4                                        │
│   ═════════════════════════════════ ─ ─ ─ ─ ─       │
│                                                       │
│   "What kind of business do you run?"                │
│                                                       │
│   ┌─────────┐  ┌─────────┐  ┌──────────┐           │
│   │ 🏠      │  │ 🏥      │  │ 🛒       │           │
│   │Interior │  │ Clinic  │  │E-commerce│           │
│   │Designer │  │         │  │          │           │
│   └─────────┘  └─────────┘  └──────────┘           │
│   ┌─────────┐  ┌─────────┐  ┌──────────┐           │
│   │ 🍽️      │  │ ⚖️      │  │ 💻       │           │
│   │Restaur- │  │ Law     │  │ Agency   │           │
│   │  ant    │  │ Firm    │  │          │           │
│   └─────────┘  └─────────┘  └──────────┘           │
│   ┌──────────────────────┐                           │
│   │ Other: [___________] │                           │
│   └──────────────────────┘                           │
│                                                       │
│                              [Next →]                 │
└─────────────────────────────────────────────────────┘
```

**Step 2: "What's your biggest challenge?"**
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│   Step 2 of 4                                        │
│   ══════════════════════════════════════ ─ ─ ─      │
│                                                       │
│   "What keeps you up at night?"                      │
│                                                       │
│   ○ "I need more website traffic"        → SEO tools │
│   ○ "I need more leads/clients"          → Outreach  │
│   ○ "I can't keep up with content"       → Blog/Social│
│   ○ "My online reputation needs work"    → Reviews   │
│   ○ "I need to automate my operations"   → Full OS   │
│                                                       │
│   (This determines which tool is highlighted first)  │
│                                                       │
│                     [← Back]   [Next →]              │
└─────────────────────────────────────────────────────┘
```

**Step 3: "Let's personalize your space" (THE FUN ONE)**
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│   Step 3 of 4                                        │
│   ══════════════════════════════════════════ ─       │
│                                                       │
│   "One more thing... what's your favorite shape?"    │
│   (This customizes your dashboard ✨)                │
│                                                       │
│   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐           │
│   │ ● │   │ ▲ │   │ ■ │   │ ⬡ │   │ ★ │           │
│   │   │   │   │   │   │   │   │   │   │           │
│   └───┘   └───┘   └───┘   └───┘   └───┘           │
│  Circle  Triangle Square  Hexagon  Star              │
│                                                       │
│  (When user hovers/clicks a shape:)                  │
│  Floating animated shapes of that type appear on     │
│  the sides of the screen, gently rotating/floating.  │
│  They pulse in the brand's accent color.             │
│                                                       │
│  COLOR: "Pick your vibe"                             │
│  [🟣 Purple] [🔵 Blue] [🟢 Green] [🟡 Gold] [🔴 Red]│
│                                                       │
│                     [← Back]   [Next →]              │
└─────────────────────────────────────────────────────┘
```

**The "Floating Shapes" Feature (Detailed Spec):**
- After the user selects a shape, subtle floating illustrations of that shape appear:
  - In the dashboard sidebar background (very faint, opacity 0.03-0.05)
  - As loading animations (shape morphs while waiting)
  - In empty states ("No projects yet" with floating shapes)
  - In achievement celebrations (shapes burst outward like confetti)
- The shapes use the user's chosen accent color
- CSS animation: `float` keyframes (gentle up/down/rotate)
- Performance: Use CSS transforms only (GPU-accelerated), max 8-10 shapes visible
- This is a RETENTION HOOK — it makes the dashboard feel personal and unique

**Step 4: "Connect your tools" (Optional)**
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│   Step 4 of 4                                        │
│   ══════════════════════════════════════════════     │
│                                                       │
│   "Connect your platforms (you can skip this)"       │
│                                                       │
│   ┌────────────┐                                     │
│   │ WordPress  │  [Connect]  or  [Skip]             │
│   │ URL + App  │                                     │
│   │ Password   │                                     │
│   └────────────┘                                     │
│                                                       │
│   ┌────────────┐                                     │
│   │ Google     │  [Connect via OAuth]  or [Skip]    │
│   │ Analytics  │                                     │
│   └────────────┘                                     │
│                                                       │
│              [Skip All → Go to Dashboard]            │
│                    [Complete Setup →]                 │
└─────────────────────────────────────────────────────┘
```

---

### SCREEN 4: Main Dashboard (Command Center)

**Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px)         │  MAIN CONTENT                         │
│  ┌────────────────────┐  │                                       │
│  │  [Webness Logo]    │  │  "Welcome back, {Name}! 👋"          │
│  │                    │  │                                       │
│  │  ┌──────────────┐ │  │  ┌─────────┐  ┌─────────┐  ┌──────┐ │
│  │  │ 💰 Credits   │ │  │  │ 📊 Score│  │ 📝 Posts│  │ 👥   │ │
│  │  │    347       │ │  │  │   72    │  │   28   │  │Leads │ │
│  │  │  ▓▓▓▓▓░░░░  │ │  │  │  /100   │  │ this mo│  │  142 │ │
│  │  │  (69% used)  │ │  │  └─────────┘  └─────────┘  └──────┘ │
│  │  │  [Top Up]    │ │  │                                       │
│  │  └──────────────┘ │  │  QUICK ACTIONS                        │
│  │                    │  │  ┌──────────────────────────────────┐ │
│  │  📊 Dashboard     │  │  │ "What would you like to do?"     │ │
│  │  🛠️ Tools         │  │  │ ┌──────┐ ┌──────┐ ┌──────┐     │ │
│  │  📁 Projects      │  │  │ │🔍Audit│ │✍️Blog │ │📱Social│    │ │
│  │  📈 Analytics     │  │  │ │ FREE  │ │15 cr │ │ 5 cr │     │ │
│  │  💳 Credits       │  │  │ └──────┘ └──────┘ └──────┘     │ │
│  │  ⚙️ Settings      │  │  └──────────────────────────────────┘ │
│  │  👑 Admin         │  │                                       │
│  │                    │  │  RECENT ACTIVITY                      │
│  │  ─────────────── │  │  ┌──────────────────────────────────┐ │
│  │                    │  │  │ ✅ Blog: "AI Marketing Trends"  │ │
│  │  SYSTEM STATUS     │  │  │    Score: 87/100 • 2 hours ago  │ │
│  │  🟢 Brain: Online  │  │  │ ✅ Audit: example.com           │ │
│  │  🟢 Queue: 0 jobs  │  │  │    Score: 47/100 • 5 hours ago  │ │
│  │  🟢 API: Healthy   │  │  │ ⏳ Blog: "Interior Design Tips" │ │
│  │                    │  │  │    Processing... [Watch Live →]  │ │
│  │  (Floating shapes  │  │  └──────────────────────────────────┘ │
│  │   in background)   │  │                                       │
│  └────────────────────┘  │  ACHIEVEMENTS                         │
│                           │  🏅 First Audit  🏅 5 Blogs  🔒 10x │
└──────────────────────────┴───────────────────────────────────────┘
```

**Key Interactions:**
- Credit gauge animates when credits change (fills/depletes smoothly)
- "Brain: Online/Offline" indicator shows real Local PC status
- "Watch Live →" link opens LiveView for in-progress tasks
- Achievement badges unlock with confetti + floating shape animation
- System status updates every 30 seconds via SSE

---

### SCREEN 5: The Glass Factory (LiveView — Tool Execution)

This is the MOST IMPORTANT screen. This is what makes Webness feel "magical."

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  "Blog Writer: AI Marketing Trends 2026"     [Cancel] [Minimize]│
├──────────────────────────────┬──────────────────────────────────┤
│  PIPELINE STEPS              │  LIVE OUTPUT                     │
│                              │                                   │
│  ┌────────────────────────┐  │  ┌─────────────────────────────┐ │
│  │ 1. 🔍 Research         │  │  │                             │ │
│  │    ✅ Complete (3.2s)   │  │  │  # AI Marketing Trends     │ │
│  │    Found 8 sources      │  │  │                             │ │
│  │    [View sources ▾]     │  │  │  In 2026, artificial       │ │
│  └────────────────────────┘  │  │  intelligence has become    │ │
│  ┌────────────────────────┐  │  │  the cornerstone of modern  │ │
│  │ 2. 📋 Outline          │  │  │  marketing strategies...    │ │
│  │    ✅ Complete (2.1s)   │  │  │                             │ │
│  │    8 sections planned   │  │  │  ## The Rise of Agentic    │ │
│  │    [View outline ▾]     │  │  │  Marketing                 │ │
│  └────────────────────────┘  │  │                             │ │
│  ┌────────────────────────┐  │  │  Unlike traditional auto-   │ │
│  │ 3. ✍️ Drafting          │  │  │  mation, agentic AI can█   │ │
│  │    ⏳ In Progress...    │  │  │  (cursor blinks here —     │ │
│  │    ▓▓▓▓▓▓░░░ 62%       │  │  │   typewriter effect)       │ │
│  │    1,247 words so far   │  │  │                             │ │
│  └────────────────────────┘  │  │                             │ │
│  ┌────────────────────────┐  │  └─────────────────────────────┘ │
│  │ 4. ✨ Polishing         │  │                                  │
│  │    ⬜ Waiting...        │  │  CONTENT SCORE (Live)            │
│  └────────────────────────┘  │  ┌──────────────────────┐        │
│  ┌────────────────────────┐  │  │  SEO: ▓▓▓▓▓▓░░ 72   │        │
│  │ 5. 🖼️ Images           │  │  │  Read: ▓▓▓▓▓▓▓░ 85  │        │
│  │    ⬜ Waiting...        │  │  │  Words: 1,247/2,000  │        │
│  └────────────────────────┘  │  └──────────────────────┘        │
│  ┌────────────────────────┐  │                                  │
│  │ 6. 📤 Publish          │  │  AGENT LOG (Terminal)            │
│  │    ⬜ Waiting...        │  │  ┌──────────────────────┐       │
│  └────────────────────────┘  │  │ 🤖 Writer: Starting   │       │
│                              │  │    section 4 of 8...   │       │
│  CRITIC FEEDBACK (if retry)  │  │ 📊 Score updated: 72  │       │
│  ┌────────────────────────┐  │  │ 🤖 Writer: Adding     │       │
│  │ ⚠️ Attempt 2/3         │  │  │    statistics from     │       │
│  │ Critic: "Needs more    │  │  │    research data...    │       │
│  │ keyword density in     │  │  └──────────────────────┘       │
│  │ section 3"             │  │                                  │
│  └────────────────────────┘  │                                  │
├──────────────────────────────┴──────────────────────────────────┤
│  Estimated time remaining: ~2 minutes   Credits: 15 will be used│
└─────────────────────────────────────────────────────────────────┘
```

**Key Interactions:**
- Left panel: Step cards animate from gray → spinning → green checkmark
- Right panel: Content appears letter by letter (typewriter via SSE tokens)
- Content Score updates LIVE as content is being written
- Agent Log scrolls automatically, showing what the AI is "thinking"
- If Critic rejects → "Attempt 2/3" banner appears, Writer retries with feedback
- Progress bar under each step is driven by SSE `step_progress` events
- Estimated time countdown updates based on actual step durations
- User can click "View sources" / "View outline" to expand collapsed sections

---

### SCREEN 6: Result View (Post-Completion)

```
┌─────────────────────────────────────────────────────────────────┐
│  "Blog Writer: AI Marketing Trends 2026"    ✅ Complete          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SCORE CARD                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │Overall  │  │  SEO    │  │Readabil │  │Keywords │           │
│  │  87     │  │  82     │  │  91     │  │  78     │           │
│  │ /100    │  │ /100    │  │ /100    │  │ /100    │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
│                                                                   │
│  ┌─ CONTENT ──────────────────────────────────────────────────┐ │
│  │  (Full rendered Markdown with images, headings, etc.)       │ │
│  │  ...                                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ACTIONS:                                                        │
│  [📥 Download ▾]  [📤 Publish to WordPress]  [📋 Copy]  [🔄 Redo]│
│   ├── DOCX                                                       │
│   ├── PDF                                                        │
│   ├── Markdown                                                   │
│   └── HTML                                                       │
│                                                                   │
│  ┌─ EXECUTION LOG ─────────────────────────────────────────────┐ │
│  │  Step 1: Research (3.2s) — 8 sources analyzed               │ │
│  │  Step 2: Outline (2.1s) — 8 sections planned                │ │
│  │  Step 3: Draft (45.3s) — 2,156 words, Model: llama3.1:8b   │ │
│  │  Step 4: Polish (12.7s) — Critic score: 87/100              │ │
│  │  Step 5: Images (8.4s) — 2 images generated                 │ │
│  │  Total: 71.7s — Credits used: 15                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  🎉 ACHIEVEMENT UNLOCKED: "First Blog Post!" (+10 bonus credits)│
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Retention & Re-Engagement System

### Popup Triggers (Non-Intrusive, Smart Timing)

| Trigger | When | Message | CTA |
|---|---|---|---|
| **First Visit** | After onboarding | "Your dashboard is ready! Let's run your first audit." | [Run Free Audit] |
| **Low Credits** | Balance < 10% of plan | "You're running low! Top up to keep the AI working." | [Top Up Credits] |
| **3-Day Inactive** | No login for 3 days | "Your competitors published 12 blogs this week. Don't fall behind!" | [Generate a Blog] |
| **7-Day Inactive** | No login for 7 days | "We noticed your SEO score dropped 5 points. Want to check?" | [Run Audit] |
| **Post-Completion** | After any tool finishes | "Your blog scored 87! Share this win on LinkedIn?" | [Share] [Skip] |
| **Streak Reward** | 7 consecutive days with activity | "🔥 7-day streak! Here's 50 bonus credits." | [Claim Reward] |
| **Milestone** | 10th blog published | "🎉 You've published 10 blogs! You're in the top 5% of users." | [View Stats] |

### Achievement System

| Achievement | Unlock Condition | Reward |
|---|---|---|
| 🏅 First Blood | Complete first audit | 25 bonus credits |
| ✍️ Wordsmith | Publish first blog | 50 bonus credits |
| 📱 Social Butterfly | Generate first social pack | 10 bonus credits |
| 🔥 On Fire | 7-day activity streak | 50 bonus credits |
| 🏆 Content Machine | 10 blogs published | 100 bonus credits |
| 🎯 SEO Master | Reach score 90+ on an audit | 25 bonus credits |
| 🌍 Polyglot | Generate content in 3+ languages | 30 bonus credits |
| 💎 Power User | Use all available tools | 100 bonus credits |
| 👑 OG Member | Be a beta user | Permanent "OG" badge |

### The "Floating Shapes" Retention Element
- Shapes are personalized to the user's choice from onboarding
- They appear subtly in the UI:
  - **Sidebar background:** Very faint (opacity 0.03), 3-4 floating shapes
  - **Loading states:** Instead of a spinner, the user's shape morphs/pulses
  - **Empty states:** "No projects yet" page has floating shapes with "Start your first project" CTA
  - **Achievement celebrations:** Shapes burst outward like confetti (matched to user's shape)
  - **Hover effects:** Cards/buttons have subtle shape outlines on hover
- This creates "I built this" attachment — users feel the dashboard is THEIRS

---

## 4. The "Credit Cost Preview" Pattern

Before ANY paid action, show:

```
┌──────────────────────────────────────────────┐
│  Blog Writer: "AI Marketing Trends"           │
│                                               │
│  Estimated Cost: ~15 credits                  │
│  Your Balance:   347 credits                  │
│  After:          332 credits remaining        │
│                                               │
│  ⚡ Estimated Time: 2-3 minutes               │
│                                               │
│  [Cancel]              [Run Tool → 15 credits]│
└──────────────────────────────────────────────┘
```

**Rules:**
- ALWAYS show cost before execution
- ALWAYS show remaining balance
- If insufficient credits → Disable "Run" button, show "Top Up" CTA
- Credits are deducted when job is QUEUED (not when completed)
- If job FAILS → Credits are automatically REFUNDED

---

## 5. Admin Dashboard (Webness Owner Only)

```
┌──────────────────────────────────────────────────────────────────┐
│  ADMIN: Webness OS Control Panel                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  SYSTEM HEALTH                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 🟢 Brain │  │ 🟢 API   │  │ 🟢 Redis │  │ 🟢 DB    │        │
│  │  Online  │  │  Healthy │  │  3MB/256 │  │  42MB    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                    │
│  REVENUE THIS MONTH                                               │
│  ┌─────────────────────────────────────────┐                     │
│  │  $2,340  (+23% vs last month)           │                     │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░          │                     │
│  └─────────────────────────────────────────┘                     │
│                                                                    │
│  QUEUE STATUS                                                     │
│  Active: 2  │  Waiting: 5  │  Failed: 0  │  Completed Today: 47 │
│                                                                    │
│  ORGANIZATIONS (12)                                               │
│  ┌────────────────────────────────────────────────┐              │
│  │ Name          │ Plan    │ Credits │ Last Active │              │
│  │ Acme Designs  │ Pro     │ 1,247   │ 2h ago      │              │
│  │ SmileDental   │ Starter │ 89      │ 1d ago      │              │
│  │ FreshBites    │ Free    │ 500     │ 5d ago ⚠️   │              │
│  └────────────────────────────────────────────────┘              │
│                                                                    │
│  ACTIONS:                                                         │
│  [Grant Credits] [Create Org] [View Logs] [Backup DB]            │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Mobile Responsiveness Notes

- Dashboard sidebar collapses to hamburger menu on < 768px
- LiveView stacks vertically (steps on top, output below)
- Credit badge moves to header bar on mobile
- Tool cards become scrollable horizontal carousel
- Floating shapes reduce to 2-3 (performance)
- All touch targets minimum 44px × 44px

---

*This is the UX bible. Every component, every animation, every interaction is specified here. The AI coder should reference this for every frontend task.*
