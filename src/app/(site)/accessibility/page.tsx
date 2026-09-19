import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description: "This portfolio's commitment to WCAG 2.2 Level AA accessibility and how to report barriers.",
};

export default function AccessibilityPage() {
  return (
    <section
      className="mx-auto max-w-[1400px] px-6 md:px-10 pt-28 md:pt-40 pb-16 md:pb-24"
      aria-label="Accessibility statement"
    >
      <p className="label-mono text-muted-foreground mb-6">LEGAL</p>
      <h1 className="font-body text-4xl md:text-6xl font-light tracking-tight text-foreground mb-10">
        Accessibility Statement
      </h1>
      <div className="max-w-3xl flex flex-col gap-8 font-body text-sm md:text-base leading-relaxed text-foreground">
        <p>
          This site targets WCAG 2.2 Level AA: text contrast meets the 4.5:1 ratio on all surfaces, every interactive
          element exposes a visible keyboard focus state, all imagery carries descriptive alternative text, and the
          layout is fully responsive from 320px upward. The project gallery viewer can be operated entirely from the
          keyboard, and motion — including the marquee band and hover previews — respects the
          &quot;prefers-reduced-motion&quot; system setting.
        </p>
        <p>
          Semantic landmarks (header, nav, main, footer) and ARIA labelling are used throughout, and forms announce
          their validation errors both inline and to assistive technology. If you encounter a barrier — a control you
          cannot reach, a contrast issue, a screen-reader dead end — please report it and it will be treated as a bug.
        </p>
        <p>
          Report accessibility problems by emailing{" "}
          <a
            href="mailto:hello@alexmoreau.design"
            className="text-cobalt underline underline-offset-4 hover:text-foreground transition-colors"
          >
            hello@alexmoreau.design
          </a>
          . This statement was last updated in 2026.
        </p>
      </div>
    </section>
  );
}
