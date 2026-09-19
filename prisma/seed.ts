/**
 * Seed the database with the portfolio's project catalog and (optionally)
 * the owner account. Idempotent: running it twice updates content in place
 * and never duplicates rows.
 *
 * Owner credentials come from the environment — no default password ships
 * in the repo:
 *   ADMIN_EMAIL (default admin@alexmoreau.design)
 *   SEED_ADMIN_PASSWORD (required for first boot; ignored afterwards)
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCb) as (p: string, s: Buffer, k: number) => Promise<Buffer>;

interface SeedProject {
  slug: string;
  order: number;
  title: string;
  subtitle: string;
  role: string;
  year: string;
  category: string;
  objective: string;
  tagline: string;
  description: string;
  problem: string;
  solution: string;
  process: string;
  outcomes: string[];
  deliverables: string[];
  gallery: { kind: "image" | "video"; src: string; alt: string }[];
  heroImage: string;
  coverImage: string;
  processImage: string;
  featured: boolean;
}

const P = (slug: string, file: string) => `/projects/${slug}/${file}`;

const PROJECTS: SeedProject[] = [
  {
    slug: "kinto-cafe-branding",
    order: 1,
    title: "Kinto",
    subtitle: "Matcha Brand Identity",
    role: "Brand Designer",
    year: "2035",
    category: "Branding",
    objective:
      "Create a full brand identity for a premium matcha brand rooted in Japanese tea culture — from ceremonial ritual to retail shelf.",
    tagline: "Matcha, elevated",
    description:
      "Kinto is a premium matcha brand rooted in Japanese tea culture. The brief was to build an identity as refined as the ceremonial-grade matcha itself — one that felt at home between a hand-thrown ceramic bowl and a minimalist café shelf. We spent time immersed in the rituals of preparation before touching a pencil.",
    problem:
      "Kinto had an exceptional product but no visual personality. The brand wasn't communicating its Japanese-influenced, ceremony-rooted philosophy. The space felt generic, and the brand wasn't communicating its Japanese-influenced, slow-coffee philosophy.",
    solution:
      "A clean, deliberate identity rooted in Japanese grid principles and muted earthy tones — with a wordmark that references the geometry of a ceramic cup when viewed from above.",
    process:
      "We started with a 2-week immersion in the café, observing rituals, materials, and customer behavior. The identity emerged from the objects themselves: the circular mark, the kraft paper textures, the hand-stamped feel of collateral.",
    outcomes: [
      "Brand recall increased 3x within 6 months of opening",
      "Featured in Café Design Quarterly",
      "Expanded to second location — identity scaled seamlessly",
    ],
    deliverables: [
      "Logo & Mark System",
      "Packaging Suite",
      "Café Signage & Wayfinding",
      "Menu & Stationery",
      "Brand Guidelines",
    ],
    gallery: [
      { kind: "image", src: P("kinto-cafe-branding", "gallery-01.jpg"), alt: "Kinto — packaging suite on shelf" },
      { kind: "image", src: P("kinto-cafe-branding", "gallery-02.jpg"), alt: "Kinto — matcha tin detail" },
      { kind: "image", src: P("kinto-cafe-branding", "gallery-03.jpg"), alt: "Kinto — café signage" },
      { kind: "image", src: P("kinto-cafe-branding", "gallery-04.jpg"), alt: "Kinto — stationery set" },
      { kind: "image", src: P("kinto-cafe-branding", "gallery-05.jpg"), alt: "Kinto — menu design" },
    ],
    heroImage: P("kinto-cafe-branding", "hero.jpg"),
    coverImage: P("kinto-cafe-branding", "cover.jpg"),
    processImage: P("kinto-cafe-branding", "process.jpg"),
    featured: true,
  },
  {
    slug: "grove-packaging",
    order: 2,
    title: "The Blue Shift",
    subtitle: "Magazine Design & Merchandise",
    role: "Art Director",
    year: "2035",
    category: "Print & Merchandise",
    objective:
      "Create a cohesive visual identity system merging pixel-based forms with fluid, expressive typography across print, objects, and spatial elements.",
    tagline: "Pixel meets fluid.",
    description:
      "A visual identity merging pixel-based forms with fluid, expressive typography. The system translates material transformation into a cohesive language across print, objects, and spatial elements. A bold blue palette and modular layouts balance precision with experimentation.",
    problem:
      "The project needed to bridge the rigidity of pixel-based digital forms with the organic expressiveness of editorial typography — two languages that rarely coexist without one overwhelming the other.",
    solution:
      "A modular identity system built around a bold blue palette, where pixel grids and fluid type coexist through careful tension — each informing the other without compromising either.",
    process:
      "The system was developed by mapping points of friction between digital precision and typographic freedom. Each element — from die-line to poster — was treated as a test of the identity's flexibility.",
    outcomes: [
      "Featured in Print Magazine's Annual Awards",
      "Merchandise sell-through exceeded projections by 60%",
      "Identity system licensed for two additional editorial publications",
    ],
    deliverables: ["Packaging Die-lines", "Unboxing Experience", "Social Assets", "Posters"],
    gallery: [
      { kind: "image", src: P("grove-packaging", "gallery-01.jpg"), alt: "The Blue Shift — magazine covers" },
      { kind: "image", src: P("grove-packaging", "gallery-02.jpg"), alt: "The Blue Shift — merchandise flat lay" },
      { kind: "image", src: P("grove-packaging", "gallery-03.jpg"), alt: "The Blue Shift — poster series" },
      { kind: "image", src: P("grove-packaging", "gallery-04.jpg"), alt: "The Blue Shift — packaging detail" },
      { kind: "image", src: P("grove-packaging", "gallery-05.jpg"), alt: "The Blue Shift — print spread" },
    ],
    heroImage: P("grove-packaging", "hero.jpg"),
    coverImage: P("grove-packaging", "cover.jpg"),
    processImage: P("grove-packaging", "process.jpg"),
    featured: true,
  },
  {
    slug: "lune-web-identity",
    order: 3,
    title: "ST.Lab",
    subtitle: "Brand Identity & Apparel Design",
    role: "Brand & Apparel Designer",
    year: "2035",
    category: "Branding",
    objective:
      "Develop a streetwear brand identity that translates laboratory precision into an apparel system — marks, garments, and launch campaign.",
    tagline: "Laboratory, worn.",
    description:
      "ST.Lab treats the laboratory as a wardrobe. Clinical precision — specimen labels, safety typography, industrial colour — is re-cut as an apparel system: marks that read like equipment labels, garments specified like protocols, a launch campaign shot like documentation.",
    problem:
      "Streetwear is saturated with pseudo-scientific graphics that borrow the aesthetics of labs without their discipline. ST.Lab needed the opposite: a system where the typography, sizing, and materials genuinely followed laboratory conventions.",
    solution:
      "A strict typographic grid borrowed from labelling standards (DIN-inspired, all-caps, tight tracking) applied across marks, garment tags, and packaging — softened only by garment drape and campaign photography.",
    process:
      "We audited real specimen labels and safety signage, extracted their grid and hierarchy rules, then stress-tested the system across 40+ garment placements before locking the mark. The launch campaign documented the garments like equipment — flat, lit, annotated.",
    outcomes: [
      "First drop sold out in 11 days",
      "Stocked by 3 concept stores across Berlin and Copenhagen",
      "Brand system extended into lookbook and showroom signage",
    ],
    deliverables: ["Logo & Mark System", "Garment Graphics & Tags", "Packaging", "Launch Campaign", "Lookbook Design"],
    gallery: [
      { kind: "image", src: P("lune-web-identity", "gallery-01.jpg"), alt: "ST.Lab — apparel look" },
      { kind: "image", src: P("lune-web-identity", "gallery-02.jpg"), alt: "ST.Lab — garment detail" },
      { kind: "image", src: P("lune-web-identity", "gallery-03.jpg"), alt: "ST.Lab — label system" },
      { kind: "image", src: P("lune-web-identity", "gallery-04.jpg"), alt: "ST.Lab — packaging" },
      { kind: "image", src: P("lune-web-identity", "gallery-05.jpg"), alt: "ST.Lab — campaign shot" },
    ],
    heroImage: P("lune-web-identity", "hero.jpg"),
    coverImage: P("lune-web-identity", "cover.jpg"),
    processImage: P("lune-web-identity", "process.jpg"),
    featured: true,
  },
  {
    slug: "squeezd-juice-brand",
    order: 4,
    title: "Squeez'd",
    subtitle: "Juice Brand & Packaging",
    role: "Brand Designer",
    year: "2035",
    category: "Branding",
    objective:
      "Build a joyful, shelf-shouting identity for a cold-pressed juice startup — naming, mark, packaging system, and launch assets.",
    tagline: "Squeezed, not squeezed-in.",
    description:
      "Squeez'd is a cold-pressed juice brand built on one observation: the category is either clinical (greens, sans-serif, white) or cartoonish. The opportunity was a third path — a bold editorial identity that treats fruit like colour swatches and nutrition panels like typographic playgrounds.",
    problem:
      "Health-shelf codes push brands toward either pharmacy minimalism or fruit-salad kitsch. Squeez'd needed to read fresh at 3 metres and premium at 30 centimetres — without the clichés of either code.",
    solution:
      "A colour-blocked label system keyed to each juice's dominant ingredient, a bespoke condensed wordmark that survives condensation and fridge shelves, and a nutrition panel redesigned as the brand's most typographic surface.",
    process:
      "We pressure-tested label contrast under actual fridge lighting, iterated bottle wraps at 1:1 on press-proof stock, and prototyped the wordmark against juice-stain scenarios. The system launched with 6 SKUs and a delivery-bike wrap.",
    outcomes: [
      "Subscriptions reached 1,200 in the first quarter",
      "Retail listing secured with 2 grocery chains",
      "Packaging shortlisted in a national design award",
    ],
    deliverables: ["Naming & Verbal Identity", "Logo & Wordmark", "Packaging System", "Delivery Fleet Wrap", "Launch Assets"],
    gallery: [
      { kind: "image", src: P("squeezd-juice-brand", "gallery-01.jpg"), alt: "Squeez'd — bottle line-up" },
      { kind: "image", src: P("squeezd-juice-brand", "gallery-02.jpg"), alt: "Squeez'd — label detail" },
      { kind: "image", src: P("squeezd-juice-brand", "gallery-03.jpg"), alt: "Squeez'd — colour system" },
      { kind: "image", src: P("squeezd-juice-brand", "gallery-04.jpg"), alt: "Squeez'd — fridge display" },
      { kind: "image", src: P("squeezd-juice-brand", "gallery-05.jpg"), alt: "Squeez'd — launch campaign" },
    ],
    heroImage: P("squeezd-juice-brand", "hero.jpg"),
    coverImage: P("squeezd-juice-brand", "cover.jpg"),
    processImage: P("squeezd-juice-brand", "process.jpg"),
    featured: false,
  },
  {
    slug: "sable-fashion-brand",
    order: 5,
    title: "Vexta",
    subtitle: "AI Conference Visual Identity & Web",
    role: "Brand & Web Designer",
    year: "2035",
    category: "Branding & Web",
    objective:
      "Design the complete visual identity and web experience for an AI conference — a system that scales from badge to keynote stage.",
    tagline: "Signal, staged.",
    description:
      "Vexta is an AI conference that needed to feel less like a trade show and more like a broadcast. The identity is built from a single gesture — a signal wave — that scales from favicon to 40-metre stage backdrop, while the web platform treats the schedule as an editorial object.",
    problem:
      "Tech conference branding collapses into two defaults: dark-mode neon or sterile corporate blue. Vexta needed a system with broadcast energy that still photographs well in daylight keynotes and prints legibly on badges.",
    solution:
      "A cobalt-on-paper signal wave, animated at the brand's core and static everywhere else; a typographic system that pairs a grotesque with a mono for schedule data; and a web platform with a zero-JS landing path.",
    process:
      "We prototyped the wave at 1:1 on an LED wall, mapped its legibility against stage lighting, then derived the entire print and web system from the motion test. The schedule page was designed data-first — the timetable is the hero.",
    outcomes: [
      "2,400 attendees, 96% badge-scan satisfaction",
      "Web platform served the full schedule with zero downtime",
      "Identity extended to stage, wayfinding, and merch",
    ],
    deliverables: ["Visual Identity", "Motion System", "Conference Web Platform", "Badge & Wayfinding", "Stage Backdrop"],
    gallery: [
      { kind: "video", src: P("sable-fashion-brand", "gallery-01.mp4"), alt: "Vexta — identity motion study" },
      { kind: "image", src: P("sable-fashion-brand", "gallery-02.jpg"), alt: "Vexta — keynote stage" },
      { kind: "image", src: P("sable-fashion-brand", "gallery-03.jpg"), alt: "Vexta — web platform" },
      { kind: "image", src: P("sable-fashion-brand", "gallery-04.jpg"), alt: "Vexta — badge system" },
      { kind: "image", src: P("sable-fashion-brand", "gallery-05.jpg"), alt: "Vexta — wayfinding" },
      { kind: "image", src: P("sable-fashion-brand", "gallery-06.png"), alt: "Vexta — merch drop" },
    ],
    heroImage: P("sable-fashion-brand", "hero.jpg"),
    coverImage: P("sable-fashion-brand", "cover.jpg"),
    processImage: P("sable-fashion-brand", "process.jpg"),
    featured: false,
  },
];

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function seedOwner(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? "admin@alexmoreau.design").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] owner ${email} already exists — skipping (password unchanged)`);
    return;
  }
  if (!password || password.length < 8) {
    console.warn(
      `[seed] SEED_ADMIN_PASSWORD missing/short — owner ${email} NOT created. ` +
        "Set SEED_ADMIN_PASSWORD (min 8 chars) and re-run `bun run db:seed`.",
    );
    return;
  }

  await prisma.user.create({
    data: { email, name: "Alex Moreau", role: "OWNER", passwordHash: await hashPassword(password) },
  });
  console.log(`[seed] owner ${email} created (OWNER)`);
}

async function main(): Promise<void> {
  for (const p of PROJECTS) {
    const { featured, ...rest } = p;
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: { ...rest, outcomes: JSON.stringify(p.outcomes), deliverables: JSON.stringify(p.deliverables), gallery: JSON.stringify(p.gallery), featured },
      create: { ...rest, outcomes: JSON.stringify(p.outcomes), deliverables: JSON.stringify(p.deliverables), gallery: JSON.stringify(p.gallery), featured, published: true },
    });
    console.log(`[seed] project upserted: ${p.order.toString().padStart(2, "0")} ${p.title}`);
  }
  await seedOwner();
  console.log(`[seed] done — ${PROJECTS.length} projects`);
}

main()
  .catch((e) => {
    console.error("[seed] failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
