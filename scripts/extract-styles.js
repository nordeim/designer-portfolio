// Computed-style extraction for parity comparison (run via agent-browser eval).
// Reads the same selector set on target and clone so results can be diffed.
JSON.stringify((() => {
  const pick = (el, props) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const out = {};
    for (const p of props) out[p] = cs.getPropertyValue(p);
    out._text = (el.textContent || "").trim().slice(0, 60);
    out._tag = el.tagName;
    return out;
  };
  const fontProps = ["font-family", "font-weight", "font-size", "letter-spacing", "line-height", "color", "text-transform"];
  const boxProps = ["background-color", "color", "padding-top", "padding-bottom", "margin-top", "border-top-color", "border-bottom-color"];
  const q = (sel) => document.querySelector(sel);
  return {
    bodyBg: pick(document.body, ["background-color", "color", "font-family"]),
    htmlBg: pick(document.documentElement, ["background-color"]),
    h1: pick(q("h1"), fontProps),
    heroMeta: pick(Array.from(document.querySelectorAll("span, a")).find(e => /^GRAPHIC DESIGNER$/i.test((e.textContent || "").trim())), fontProps),
    worksLabel: pick(Array.from(document.querySelectorAll("h2, span")).find(e => /SELECTED WORKS/i.test(e.textContent || "")), fontProps),
    worksHeading: pick(Array.from(document.querySelectorAll("h3")).find(e => /define my design perspective/i.test(e.textContent || "")), fontProps),
    // first project row link
    projectRow: (() => {
      const a = Array.from(document.querySelectorAll("a")).find(x => (x.getAttribute("href") || "").match(/^\/project\//));
      if (!a) return null;
      const cs = getComputedStyle(a);
      return { display: cs.display, "grid-template-columns": cs.gridTemplateColumns, gap: cs.gap, "padding-top": cs.paddingTop, "border-top": cs.borderTop };
    })(),
    rowNumbering: pick(Array.from(document.querySelectorAll("span")).find(e => /^0\d\/\d\d — /.test((e.textContent || "").trim())), fontProps),
    rowTitle: pick(Array.from(document.querySelectorAll("h3")).find(e => /^Kinto$/i.test((e.textContent || "").trim())), fontProps),
    rowSubtitle: pick(Array.from(document.querySelectorAll("p")).find(e => /Matcha Brand Identity/i.test(e.textContent || "")), fontProps),
    rowCategory: pick(Array.from(document.querySelectorAll("span")).find(e => /^Branding$/i.test((e.textContent || "").trim())), fontProps),
    marquee: (() => {
      const m = Array.from(document.querySelectorAll(".marquee-track")).pop() || Array.from(document.querySelectorAll("div")).find(d => (d.className || "").toString().includes("marquee"));
      if (!m) return null;
      const s = m.querySelector("span > span > span") || m.querySelector("span > span") || m.querySelector("span");
      const cs = s ? getComputedStyle(s) : getComputedStyle(m);
      return { "font-family": cs.fontFamily, "font-size": cs.fontSize, "font-weight": cs.fontWeight, "letter-spacing": cs.letterSpacing, "text-transform": cs.textTransform, "line-height": cs.lineHeight, animation: cs.animationName + " " + cs.animationDuration };
    })(),
    philosophy: pick(Array.from(document.querySelectorAll("p")).find(e => /design is not decoration/i.test(e.textContent || "")), fontProps.concat(["max-width"])),
    footerHeading: pick(Array.from(document.querySelectorAll("h3")).find(e => /NAVIGATION/i.test(e.textContent || "")), fontProps),
    footerLink: pick(q("footer a"), fontProps),
    copyright: pick(Array.from(document.querySelectorAll("footer *")).find(e => e.children.length === 0 && /©/.test(e.textContent || "")), fontProps),
    headerBrand: pick(Array.from(document.querySelectorAll("a")).find(e => /^A\/M$/.test((e.textContent || "").trim())), fontProps),
    headerMenu: pick(Array.from(document.querySelectorAll("button")).find(e => /menu/i.test(e.textContent || e.getAttribute("aria-label") || "")), fontProps),
    startProject: (() => {
      const a = Array.from(document.querySelectorAll("a")).find(e => /start a project/i.test(e.textContent || ""));
      if (!a) return null;
      const cs = getComputedStyle(a);
      const r = a.getBoundingClientRect();
      return { "font-family": cs.fontFamily, "font-size": cs.fontSize, "letter-spacing": cs.letterSpacing, "text-transform": cs.textTransform, position: cs.position, bottom: cs.bottom, right: cs.right, "viewport-x": Math.round(r.x + r.width), "viewport-y": Math.round(r.y + r.height) };
    })(),
    particleSample: (() => {
      const els = Array.from(document.querySelectorAll("*")).filter(e => (e.className || "").toString().match(/particle/i) || (e.getAttribute("class") || "").includes("rounded-full"));
      const dot = els.find(e => getComputedStyle(e).position === "absolute" && parseFloat(getComputedStyle(e).width) < 12);
      if (!dot) return "no absolute dot found";
      const cs = getComputedStyle(dot);
      return { width: cs.width, height: cs.height, "background-color": cs.backgroundColor, "border-radius": cs.borderRadius, count: els.length };
    })(),
    linkColors: { normal: (() => { const a = q("footer a"); return a ? getComputedStyle(a).color : null; })() },
    title: document.title,
  };
})())
