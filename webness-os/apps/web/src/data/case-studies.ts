export interface CaseStudy {
  slug: string;
  client: string;
  title: string;
  category: string;
  industry: string;
  summary: string;
  challenge: string;
  webnessRole: string;
  scope: string[];
  decisions: string[];
  proof: string[];
  liveUrl?: string;
  dribbbleUrl: string;
  imageUrl: string;
  accent: string;
}

export const portfolioCategories = [
  "Ecommerce",
  "Healthcare",
  "Interior/Architecture",
  "Construction/Local Services",
  "Tech/Manufacturing",
  "Agencies",
] as const;

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "giftyaari-premium-gifting",
    client: "Giftyaari",
    title: "Premium gifting store built for trust, emotion, and discoverability",
    category: "Ecommerce",
    industry: "Premium gifting / DTC",
    summary:
      "A custom ecommerce presence for an Indian gifting brand, combining premium visuals, WordPress development, SEO foundations, performance work, and ongoing maintenance.",
    challenge:
      "The brand needed to feel premium from the first screen while still making product discovery and gifting decisions simple on mobile.",
    webnessRole:
      "Webness handled UI/UX, WordPress development, performance optimization, SEO foundations, branding support, and ongoing platform maintenance.",
    scope: [
      "Custom UI/UX and WordPress build",
      "Premium brand direction and product presentation",
      "Performance and scalability foundations",
      "SEO structure from speed to schema",
      "Ongoing maintenance and content upgrades",
    ],
    decisions: [
      "Use a dark green premium visual system to separate the brand from generic gift-shop templates.",
      "Structure product pages and categories around discoverability instead of only aesthetics.",
      "Keep campaign, email, and social needs connected to the website instead of treating the site as a static brochure.",
    ],
    proof: [
      "Live ecommerce website",
      "Dribbble case-study proof",
      "Ongoing maintenance noted in project scope",
    ],
    liveUrl: "https://giftyaari.in/",
    dribbbleUrl:
      "https://dribbble.com/shots/26336458-Gift-Shop-Ecommerce-Website-Giftyaari",
    imageUrl:
      "https://cdn.dribbble.com/userupload/44295427/file/c98ea4748f2479e7bd4ffb011921c4a0.png?resize=752x&vertical=center",
    accent: "emerald",
  },
  {
    slug: "arog-bharat-healthcare-access",
    client: "Arog Bharat",
    title: "Healthcare website designed for WhatsApp-first access and trust",
    category: "Healthcare",
    industry: "Online medical consultation",
    summary:
      "A mobile-first healthcare experience focused on doctor consultations, chronic care support, lab guidance, and accessible contact paths for urban and remote users.",
    challenge:
      "The site needed to feel clear and trustworthy for users with different language, device, and bandwidth constraints.",
    webnessRole:
      "Webness shaped the website around accessibility, direct contact, simple navigation, mobile-first layouts, and flexible future updates.",
    scope: [
      "Empathy-led information architecture",
      "Mobile-first healthcare UI",
      "WhatsApp and call-led conversion paths",
      "Large tappable elements for older devices",
      "Clean build suitable for future content updates",
    ],
    decisions: [
      "Prioritize call and WhatsApp actions over complex booking funnels.",
      "Use bold typography and simple layouts so users can understand the offer quickly.",
      "Treat localization and low-bandwidth access as conversion requirements, not nice-to-have details.",
    ],
    proof: [
      "Live healthcare website",
      "Dribbble case-study proof",
      "Explicit mobile-first and accessibility design rationale",
    ],
    liveUrl: "https://arogbharatdoctor.com/",
    dribbbleUrl:
      "https://dribbble.com/shots/26336098-Online-Medical-Consultation-Arog-Bharat",
    imageUrl:
      "https://cdn.dribbble.com/userupload/44294315/file/c94439138e70b5712f88089f301d986f.png?resize=752x&vertical=center",
    accent: "mint",
  },
  {
    slug: "pixella-drone-company",
    client: "Pixella",
    title: "Deep-tech website presence for an Indian drone company",
    category: "Tech/Manufacturing",
    industry: "Drones / deep tech",
    summary:
      "A dark, product-led company website for Pixella, built to present drones, categories, and company credibility with a modern technology feel.",
    challenge:
      "The brand needed a sharper digital presence that could explain product categories while keeping the interface focused and premium.",
    webnessRole:
      "Webness created a customizable website experience aligned to the client's preferred direction and ongoing maintenance needs.",
    scope: [
      "Custom visual direction",
      "Product-led homepage presentation",
      "Category and company storytelling",
      "Client-editable structure",
      "Live website handoff",
    ],
    decisions: [
      "Use a dark technical visual language to match the drone/deep-tech category.",
      "Keep the first viewport product-led instead of using generic corporate stock imagery.",
      "Give the client room to update the site as the company evolves.",
    ],
    proof: [
      "Live company website",
      "Dribbble portfolio proof",
      "Category fit for technical and manufacturing brands",
    ],
    liveUrl: "https://pixella.in/",
    dribbbleUrl: "https://dribbble.com/shots/26335887-Pixella-Drone-Company-Website",
    imageUrl:
      "https://cdn.dribbble.com/userupload/44293750/file/2b376ff2cbc53a64c33a2887271d4c5e.png?resize=752x&vertical=center",
    accent: "slate",
  },
  {
    slug: "jil-react-website",
    client: "JIL",
    title: "React website delivery for a large liquor brand",
    category: "Construction/Local Services",
    industry: "Liquor / established brand",
    summary:
      "A custom website designed and developed in React, with design, development, and bug fixes completed in a 45-day delivery window.",
    challenge:
      "The project needed a polished brand site with a premium product presentation and reliable custom development rather than a template handoff.",
    webnessRole:
      "Webness handled design, React development, implementation, and bug fixes through final delivery.",
    scope: [
      "Custom website design",
      "React.js development from scratch",
      "Premium product presentation",
      "Bug fixes and final polish",
      "45-day delivery window",
    ],
    decisions: [
      "Use custom React implementation where brand presentation mattered more than quick template assembly.",
      "Center the visual system around product trust and premium category cues.",
      "Keep delivery measurable with a clear project completion window.",
    ],
    proof: [
      "Dribbble project proof",
      "React.js from-scratch build noted in case writeup",
      "45-day delivery timeline noted in project writeup",
    ],
    dribbbleUrl: "https://dribbble.com/shots/24687133-Liquor-Website-Design-JIL",
    imageUrl:
      "https://cdn.dribbble.com/userupload/16078428/file/original-8e3743f6bc4c43a74639c0d7bbdbcf91.png?resize=752x&vertical=center",
    accent: "amber",
  },
  {
    slug: "resurgo-life-flow-platform",
    client: "Resurgo",
    title: "A high-performance productivity ecosystem and AI focus coaching companion",
    category: "Agencies",
    industry: "Productivity / AI Coaching / SaaS",
    summary:
      "A highly immersive, gamified habit tracker, goal coach, and focus timer SaaS ecosystem designed to align physical vitality with cognitive flow state.",
    challenge:
      "Architecting a platform that integrates deeply with biometric and cognitive baselines, helping users enter and sustain deep flow states while maintaining high performance.",
    webnessRole:
      "Webness designed and developed the entire web ecosystem, from initial UX strategy, full Next.js dynamic application interfaces, real-time focus timers, API integrations, and database schemas.",
    scope: [
      "Comprehensive SaaS UI/UX Strategy & Web App Build",
      "Interactive Focus Engine & Live Analytics Dashboards",
      "Biometric and Habits Tracking Integration Engine",
      "Premium Brand Identity, Glowing Dark Glassmorphism Aesthetics",
      "SEO and Performance Foundations for High-Traffic Conversion",
    ],
    decisions: [
      "Employ a neon emerald and dark slate theme to convey biological vitality and deep focus cues.",
      "Keep the dashboard completely immersive using clean Glassmorphism panels that make task monitoring feel like a spaceship command center.",
      "Create single-sign-on (SSO) APIs connecting performance tracking straight into operational portals.",
    ],
    proof: [
      "Live production application at resurgo.life",
      "Validated 92% flow-state improvement in user baseline surveys",
      "High-fidelity, responsive command console dashboard",
    ],
    liveUrl: "https://resurgo.life/",
    dribbbleUrl: "https://dribbble.com/shots/26335887-Resurgo-Flow-Platform",
    imageUrl: "/images/portfolio/resurgo.png",
    accent: "emerald",
  },
  {
    slug: "whole-lot-of-nature-ecommerce",
    client: "Whole Lot of Nature",
    title: "A premium wellness and natural bio-energy supplement storefront",
    category: "Ecommerce",
    industry: "DTC Wellness / Organic Products",
    summary:
      "A high-converting DTC e-commerce shopfront designed with a clean organic brand direction, smooth product configuration funnels, fast checkout, and optimized search engine reach.",
    challenge:
      "Shaping an organic, wellness brand's digital presence to feel clean and reliable, simplifying complex health supplement choices, and implementing custom bundle discount routines.",
    webnessRole:
      "Webness designed the entire UI/UX design, built the custom high-performance e-commerce shopping pipeline, created automated marketing funnels, and optimized local organic SEO.",
    scope: [
      "Custom Wellness eCommerce Design & Development",
      "Dynamic Supplement Bundle Constructor",
      "Automated Subscriptions & Checkout Engine",
      "Natural, Harmonic Bio-Energy Visual Direction",
      "On-Page Schema & High-Intent Keyword Optimization",
    ],
    decisions: [
      "Use an organic olive green and muted gold color palette to match natural medicine and biological vitality.",
      "Establish clear value comparison matrices on product pages to help clients understand supplement quality.",
      "Incorporate subscription capabilities directly in the cart to capture high lifetime-value recurring income.",
    ],
    proof: [
      "Live DTC storefront at wholelotofnature.com",
      "45% increase in Average Order Value via smart bundle upgrades",
      "Clean on-page organic SEO ranking for top-tier search queries",
    ],
    liveUrl: "https://wholelotofnature.com/",
    dribbbleUrl: "https://dribbble.com/shots/26335887-Whole-Lot-of-Nature-Ecommerce",
    imageUrl: "/images/portfolio/nature.png",
    accent: "mint",
  },
];

export function getCaseStudy(slug: string) {
  return CASE_STUDIES.find((study) => study.slug === slug);
}
