import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// FormattedAnswer — renders Groq/LLM markdown without a markdown library.
//
// Handles everything Groq actually produces:
//   ```lang ... ```  → terminal card
//   | table |        → styled table
//   ## / ###         → section heading
//   **bold**         → strong
//   `code`           → inline pill
//   - / * bullets    → bullet list
//   1. 2. 3.         → numbered list
//   ---              → divider
//   plain text       → paragraph
// ---------------------------------------------------------------------------

export function FormattedAnswer({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        switch (block.type) {

          case "code":
            return (
              <div key={i} className="rounded-xl bg-black/40 border border-white/8 overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/8">
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  {block.lang && (
                    <span className="ml-1.5 text-[9px] font-mono text-white/25 uppercase tracking-wider">
                      {block.lang}
                    </span>
                  )}
                </div>
                <pre className="px-4 py-3 text-xs font-mono text-emerald-300/90 overflow-x-auto whitespace-pre">
                  {block.content}
                </pre>
              </div>
            );

          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-xl border border-white/8">
                <table className="w-full text-xs">
                  {block.headers && block.headers.length > 0 && (
                    <thead>
                      <tr className="border-b border-white/8 bg-white/[0.03]">
                        {block.headers.map((h, j) => (
                          <th key={j} className="px-3 py-2 text-left font-semibold text-white/70 whitespace-nowrap">
                            {renderInline(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {block.rows!.map((row, j) => (
                      <tr key={j} className={`border-b border-white/5 last:border-0 ${j % 2 === 1 ? "bg-white/[0.015]" : ""}`}>
                        {row.map((cell, k) => (
                          <td key={k} className="px-3 py-2 text-white/65 align-top">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "heading":
            return (
              <p key={i} className="text-sm font-bold text-white pt-1">
                {renderInline(block.content!)}
              </p>
            );

          case "divider":
            return <hr key={i} className="border-white/8" />;

          case "ul":
            return (
              <ul key={i} className="space-y-1.5">
                {block.items!.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-white/75 leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-400/60 shrink-0" />
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case "ol":
            return (
              <ol key={i} className="space-y-1.5">
                {block.items!.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-white/75 leading-relaxed">
                    <span className="font-mono text-[11px] text-indigo-300/60 shrink-0 w-5 text-right mt-0.5">
                      {j + 1}.
                    </span>
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ol>
            );

          case "paragraph":
          default:
            return (
              <p key={i} className="text-sm leading-relaxed text-white/75">
                {renderInline(block.content!)}
              </p>
            );
        }
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block types
// ---------------------------------------------------------------------------

type Block =
  | { type: "code"; lang?: string; content: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "heading"; content: string }
  | { type: "divider" }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "paragraph"; content: string };

// ---------------------------------------------------------------------------
// Block-level parser
// ---------------------------------------------------------------------------

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];

  // Split on ``` fences first so code is never parsed as markdown.
  const fenceParts = text.split("```");

  for (let fi = 0; fi < fenceParts.length; fi++) {
    if (fi % 2 === 1) {
      // Fenced code block
      const part = fenceParts[fi];
      const newlineIdx = part.indexOf("\n");
      const lang = newlineIdx > -1 ? part.slice(0, newlineIdx).trim() : "";
      const content = newlineIdx > -1 ? part.slice(newlineIdx + 1) : part;
      blocks.push({ type: "code", lang: lang || undefined, content: content.replace(/\n$/, "") });
      continue;
    }

    const lines = fenceParts[fi].split("\n");
    let i = 0;

    while (i < lines.length) {
      const raw = lines[i];
      const trimmed = raw.trim();

      // Blank line
      if (!trimmed) { i++; continue; }

      // Heading
      if (/^#{1,3}\s+/.test(trimmed)) {
        blocks.push({ type: "heading", content: trimmed.replace(/^#{1,3}\s+/, "") });
        i++; continue;
      }

      // Divider
      if (/^---+$/.test(trimmed)) {
        blocks.push({ type: "divider" });
        i++; continue;
      }

      // Table — triggered by a line that starts and ends with |
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          tableLines.push(lines[i].trim());
          i++;
        }
        const parsed = parseTable(tableLines);
        if (parsed) blocks.push(parsed);
        continue;
      }

      // Unordered list
      if (/^[-*•]\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
          // Support sub-bullets by stripping leading indent
          items.push(lines[i].trim().replace(/^[-*•]\s+/, ""));
          i++;
        }
        blocks.push({ type: "ul", items });
        continue;
      }

      // Ordered list
      if (/^\d+[.)]\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ""));
          i++;
        }
        blocks.push({ type: "ol", items });
        continue;
      }

      // Paragraph — gather until structural break
      const paraLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^#{1,3}\s+/.test(lines[i].trim()) &&
        !/^[-*•]\s+/.test(lines[i].trim()) &&
        !/^\d+[.)]\s+/.test(lines[i].trim()) &&
        !/^---+$/.test(lines[i].trim()) &&
        !lines[i].trim().startsWith("|")
      ) {
        paraLines.push(lines[i].trim());
        i++;
      }
      if (paraLines.length) {
        blocks.push({ type: "paragraph", content: paraLines.join(" ") });
      }
    }
  }

  return blocks.length > 0 ? blocks : [{ type: "paragraph", content: text }];
}

// ---------------------------------------------------------------------------
// Table parser — converts pipe-delimited lines into headers + rows.
// Skips separator rows (the |---|---| line).
// ---------------------------------------------------------------------------

function parseTable(lines: string[]): Block | null {
  const parsed = lines
    .map((l) =>
      l
        .slice(1, -1)           // strip leading/trailing |
        .split("|")
        .map((c) => c.trim())
    )
    .filter((row) => !row.every((c) => /^[-:]+$/.test(c)));  // drop separator rows

  if (parsed.length === 0) return null;
  const [headers, ...rows] = parsed;
  return { type: "table", headers, rows };
}

// ---------------------------------------------------------------------------
// Inline renderer — **bold**, `code`, plain text
// ---------------------------------------------------------------------------

function renderInline(text: string): ReactNode {
  // Match **bold** and `code` spans
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-white/90">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="rounded bg-white/10 px-1.5 py-0.5 text-[12px] font-mono text-indigo-200">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
