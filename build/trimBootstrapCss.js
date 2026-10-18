import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Keep rules for source-used classes and Bootstrap's runtime states. A grouped
// rule is retained in full if any of its selectors is needed (conservative).
export function trimBootstrapCss(sourceDirectory = "src") {
  return {
    postcssPlugin: "trim-unused-bootstrap-utilities",
    Once(root, { result }) {
      if (!/bootstrap[/\\]dist[/\\]css[/\\]bootstrap(?:\.min)?\.css$/.test(root.source?.input.file || "")) return;
      const tokens = new Set();
      function scan(directory) {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          const file = join(directory, entry.name);
          if (entry.isDirectory()) scan(file);
          else if (/\.(jsx?|css)$/.test(entry.name)) {
            result.messages.push({ type: "dependency", plugin: "trim-unused-bootstrap-utilities", file });
            for (const token of readFileSync(file, "utf8").match(/[A-Za-z_][\w-]*/g) || []) tokens.add(token);
          }
        }
      }
      scan(sourceDirectory);
      const runtime = /^(?:show$|fade$|active$|disabled$|collaps|modal|offcanvas|dropdown|spinner|is-|was-)/;
      root.walkRules((rule) => {
        if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
        const needed = rule.selectors.some((selector) => {
          if (selector.includes("\\")) return true;
          const classes = [...selector.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]);
          return !classes.length || classes.some((name) => tokens.has(name) || runtime.test(name));
        });
        if (!needed) rule.remove();
      });
      root.walkAtRules((rule) => { if (rule.nodes?.length === 0) rule.remove(); });
    },
  };
}
