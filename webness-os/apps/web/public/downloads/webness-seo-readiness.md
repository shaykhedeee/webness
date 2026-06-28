# AI Search & SEO Readiness Checklist
## Optimizing Websites for LLM Answer Engines (Perplexity, Gemini, ChatGPT Search)

---

### Shift in Discovery: From Links to Synthesis

Traditional Search Engine Optimization focused on keywords, backlinks, and search rankings. Today, users are moving towards **Answer Engines** (like ChatGPT Search, Gemini, and Perplexity) which do not just list web pages—they crawl, parse, synthesize, and cite them directly as authoritative sources.

If your site is structured like a traditional brochure, AI crawlers will skip it or fail to parse its core offerings. To ensure your brand is cited when users ask *"What are the best B2B AI agencies near me?"* or *"Who develops custom SaaS integrations?"*, you must optimize for **LLM readability**.

Use this checklist to audit and optimize your site.

---

## 📂 Section 1: AI Agent Crawl Permits & Direct Verification

Modern AI engines use dedicated user-agents to crawl the web. You must actively permit them while blocking spam scrapers.

- [ ] **Check `robots.txt` Permits**: Verify that your site allows indexing by flagship AI bots. Ensure the following configurations exist in your `/robots.txt`:
  ```text
  User-agent: GPTBot
  Allow: /
  
  User-agent: ChatGPT-User
  Allow: /
  
  User-agent: Google-Extended
  Allow: /
  
  User-agent: PerplexityBot
  Allow: /
  
  User-agent: ClaudeBot
  Allow: /
  ```
- [ ] **Establish Citation Anchors**: When presenting data, metrics, or case studies, use absolute anchor references (`href="https://domain.com/case-studies/resurgo"`) with descriptive text. AI engines extract anchor text to form their synthesis citations.
- [ ] **Optimize Content Density**: Avoid gated frames or heavy Javascript-only rendering for core claims. If an AI crawler gets an empty HTML shell because your client-side React bundle is slow, it will assume your page contains zero relevant answers.

---

## 🏷️ Section 2: Semantic HTML & Structural Hierarchy

AI models are trained on structured text. Clean semantic layouts act as highway signs for crawler parsers.

- [ ] **Single H1 Rule**: Ensure every landing page has exactly one `<h1>` tag containing the absolute main core B2B value proposition.
- [ ] **Descriptive H2 Subsections**: Use distinct `<h2>` tags for major sections (e.g. `<h2>Our Services</h2>`, `<h2>B2B Case Studies</h2>`). Avoid generic headers like `<h2>What We Do</h2>`—use rich context like `<h2>Done-For-You AI Automation Systems</h2>`.
- [ ] **HTML5 Semantic Elements**: Wrap page layouts in semantic HTML5 containers to clarify document purpose:
  * `<header>` and `<footer>` for navigation and metadata.
  * `<main>` for primary unique page contents.
  * `<section>` for specific themed modules.
  * `<article>` for independent reusable posts or case study snippets.

---

## 📊 Section 3: Schema Markup & Entity Structuring

Schema markup translates your natural language page into JSON data that search engines read programmatically.

- [ ] **Implement Organization Schema**: Inject `JSON-LD` organization schemas inside the `<head>` of your website:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Webness OS",
    "url": "https://webness.in",
    "logo": "https://webness.in/images/logo.png",
    "sameAs": [
      "https://x.com/webness_os",
      "https://linkedin.com/company/webness-os"
    ],
    "description": "Sovereign AI agency operating system and custom automation integrations."
  }
  ```
- [ ] **Product & Service Schema**: For B2B agency services or retainers, append custom `Service` or `Product` schemas detailing estimated pricing, deliverables, and service scopes to appear in structured AI query tables.

---

## ⚡ Section 4: Performance & Core Web Vitals

AI crawlers operate on tight budget constraints and will abort parsing if a site is unresponsive or slow.

- [ ] **PageSpeed Index > 85**: Optimize image assets to modern Next-Gen formats (`.webp`, `.avif`) and minify style/script bundles to keep mobile speeds under 2.5 seconds.
- [ ] **Image Alt Descriptions**: Crawlers cannot "see" images unless they are descriptively tagged. Verify that 100% of images contain robust, search-rich `alt="..."` labels (e.g. `alt="Webness B2B AI Retainer Calculator UI Mockup"`).
