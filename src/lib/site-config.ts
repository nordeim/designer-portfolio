/**
 * Site-wide configuration — the single source of truth for brand copy,
 * contact details, social links, and taxonomy used across the portfolio.
 * Values mirror the original application's constants so the clone stays
 * faithful; change them here to rebrand the whole site.
 */

export const SITE = {
  name: "Alex Moreau",
  initials: "A/M",
  title: "Designer Portfolio",
  description:
    "A high-impact, spatial portfolio gallery designed to showcase creative work through precision minimalism and cinematic storytelling.",
  role: "GRAPHIC DESIGNER",
  basedIn: "BASED: BERLIN",
  email: "hello@alexmoreau.design",
  location: "Berlin, Germany",
  availability: "Available for remote & on-site",
  copyrightYear: new Date().getFullYear(),
  copyright: `© ${new Date().getFullYear()} Alex Moreau.`,
  philosophy:
    "I believe design is not decoration — it is the deliberate structuring of meaning. Every project begins with listening, continues with questioning, and resolves through relentless iteration. The goal is never novelty. The goal is clarity.",
} as const;

export const SOCIAL_LINKS = [
  { label: "Dribbble", href: "https://dribbble.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "X / Twitter", href: "https://twitter.com" },
] as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

/** The giant ghost marquee band rendered at the top of the site footer. */
export const MARQUEE_ITEMS = [
  "BRAND IDENTITY",
  "DIGITAL PRODUCT",
  "MOTION DESIGN",
  "SPATIAL DESIGN",
  "TYPOGRAPHY",
  "ART DIRECTION",
] as const;

/**
 * The denominator of the landing/case-study "01/06" numbering. The reference
 * app hardcodes 6 (String(6).padStart(2, "0")) even though its catalog holds
 * 5 published projects — we reproduce the constant for visual parity.
 */
export const WORKS_INDEX_TOTAL = "06";

export const PROJECT_TYPES = [
  "Brand Identity",
  "Digital Product",
  "Spatial Design",
  "Motion Design",
  "Typography",
  "Other",
] as const;

export const BUDGET_RANGES = ["$10K – $25K", "$25K – $50K", "$50K – $100K", "$100K+"] as const;

export const TIMELINES = ["1 – 2 months", "3 – 6 months", "6+ months", "Flexible"] as const;

export const FAQ_ITEMS = [
  {
    q: "What is your typical process for a new project?",
    a: "Every project begins with a Discovery phase — understanding your business, audience, and objectives. From there, I develop a strategic framework before moving into design exploration, iteration, and final delivery. The exact timeline and phases vary by project scope.",
  },
  {
    q: "Do you work with international clients?",
    a: "Absolutely. While I'm based in Berlin, the majority of my clients are international. I'm experienced with remote collaboration and can accommodate various time zones. For larger projects, I'm available for on-site workshops.",
  },
  {
    q: "What is your availability like?",
    a: "I typically take on 2–3 projects at a time to ensure dedicated attention. For the most current availability, please submit an inquiry and I'll respond within 48 hours with my schedule and a preliminary timeline.",
  },
  {
    q: "Do you collaborate with other designers or agencies?",
    a: "Yes. I regularly collaborate with specialized talent — developers, copywriters, motion designers, and strategists — assembled based on each project's needs. I also partner with agencies on select projects.",
  },
  {
    q: "What does your pricing look like?",
    a: "Pricing is project-based, determined by scope, complexity, and timeline. I provide detailed proposals after an initial consultation. My minimum project engagement starts at $10,000.",
  },
] as const;

export const INQUIRY_STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED"] as const;

/** About page — experience & education timeline (most recent first). */
export const EXPERIENCE = [
  {
    period: "2023 – Present",
    role: "Independent Brand Studio",
    description:
      "Running a boutique branding practice from Berlin — working with founders, retailers, and creative studios on brand identity, packaging, and digital presence.",
  },
  {
    period: "2020 – 2023",
    role: "Senior Brand Designer — Brand Studio Berlin",
    description:
      "Led identity projects for FMCG, hospitality, and cultural brands. Responsible for full brand systems from strategy through production.",
  },
  {
    period: "2017 – 2020",
    role: "Designer — Design Agency",
    description:
      "Contributed to branding, editorial, and typography projects for fashion, culture, and music industry clients.",
  },
  {
    period: "2016",
    role: "MFA Visual Communication — Creative Agency",
    description:
      "Graduated with distinction. Thesis on typographic identity and the semiotics of brand marks.",
  },
  {
    period: "2014",
    role: "BA Graphic Design — Design & Motion Studio",
    description:
      "Foundation in Swiss design principles, brand systems, and typographic thinking.",
  },
] as const;

export const SKILL_GROUPS = [
  {
    title: "BRAND IDENTITY",
    skills: [
      "Logo & Mark Design",
      "Brand Systems",
      "Visual Identity Guidelines",
      "Naming & Verbal Identity",
      "Brand Strategy",
    ],
  },
  {
    title: "PRINT & PACKAGING",
    skills: [
      "Packaging Design",
      "Editorial & Print",
      "Signage & Environmental",
      "Label & Tag Design",
      "Production Oversight",
    ],
  },
  {
    title: "DIGITAL BRANDING",
    skills: [
      "Web Visual Direction",
      "Social Media Systems",
      "Digital Templates",
      "Motion Branding",
      "Art Direction",
    ],
  },
  {
    title: "TOOLS",
    skills: ["Figma", "Adobe Illustrator", "InDesign", "Photoshop", "Glyphs"],
  },
] as const;
