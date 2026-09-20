// Rendered-text extraction for page-level drift comparison.
// Usage: agent-browser eval "$(cat scripts/extract-text.js)" > out.json
JSON.stringify((() => {
  const main = document.querySelector("main") || document.body;
  const walk = (el, out) => {
    for (const node of el.childNodes) {
      if (node.nodeType === 3) {
        const t = (node.textContent || "").trim();
        if (t) out.push(t);
      } else if (node.nodeType === 1 && !["SCRIPT", "STYLE", "svg"].includes(node.tagName)) {
        walk(node, out);
      }
    }
    return out;
  };
  return { path: location.pathname, title: document.title, text: walk(main, []) };
})())
