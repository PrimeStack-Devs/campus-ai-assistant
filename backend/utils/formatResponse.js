/**
 * formatResponse.js
 * Parul University Smart Campus Assistant
 *
 * Produces two versions of every LLM response:
 *   - reply      → full Markdown (for Next.js with react-markdown)
 *   - replyPlain → clean plain text (for React Native)
 *
 * Usage:
 *   import { formatResponse } from './utils/formatResponse.js';
 *   const { reply, replyPlain } = formatResponse(llmOutput);
 */

/**
 * stripMarkdown(text)
 *
 * Converts markdown to clean, readable plain text.
 * Handles: headings, bold, italic, tables, blockquotes,
 *          bullets, numbered lists, links, emojis, horizontal rules.
 *
 * @param {string} text - raw markdown string from LLM
 * @returns {string} - clean plain text safe for React Native
 */
export function stripMarkdown(text) {
  if (!text || typeof text !== "string") return "";

  let plain = text;

  // ── Tables → readable plain text ──────────────────────────────────────────
  // Convert markdown tables to simple "Key: Value" lines.
  // Handles the header row, separator row, and data rows.
  plain = plain.replace(/\|(.+)\|/g, (match) => {
    // Skip separator rows like |---|---|
    if (/^\|[\s\-|:]+\|$/.test(match.trim())) return "";

    return match
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0 && !/^[-:]+$/.test(cell))
      .join("  •  ");
  });

  // ── Headings → UPPERCASE plain labels ─────────────────────────────────────
  plain = plain.replace(
    /^#{1,6}\s+(.+)$/gm,
    (_, heading) => `\n${heading.trim().toUpperCase()}\n`,
  );

  // ── Blockquotes → plain with ⚠ prefix ─────────────────────────────────────
  plain = plain.replace(/^>\s*(.+)$/gm, "⚠ $1");

  // ── Bold and italic ────────────────────────────────────────────────────────
  plain = plain.replace(/\*\*(.+?)\*\*/g, "$1"); // **bold**
  plain = plain.replace(/\*(.+?)\*/g, "$1"); // *italic*
  plain = plain.replace(/__(.+?)__/g, "$1"); // __bold__
  plain = plain.replace(/_(.+?)_/g, "$1"); // _italic_

  // ── Links → text only ─────────────────────────────────────────────────────
  plain = plain.replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)");

  // ── Inline code ───────────────────────────────────────────────────────────
  plain = plain.replace(/`(.+?)`/g, "$1");

  // ── Code blocks ───────────────────────────────────────────────────────────
  plain = plain.replace(/```[\s\S]*?```/g, "[code block]");

  // ── Horizontal rules ──────────────────────────────────────────────────────
  plain = plain.replace(/^[-*_]{3,}$/gm, "───────────────");

  // ── Bullet points → dash prefix ───────────────────────────────────────────
  plain = plain.replace(/^[\s]*[-*+]\s+(.+)$/gm, "  • $1");

  // ── Numbered lists ────────────────────────────────────────────────────────
  plain = plain.replace(/^[\s]*\d+\.\s+(.+)$/gm, (_, item, offset, str) => {
    // Detect the number from the original match
    const num = str.slice(offset).match(/^[\s]*(\d+)\./)?.[1] || "•";
    return `  ${num}. ${item}`;
  });

  // ── Clean up excessive blank lines ────────────────────────────────────────
  plain = plain.replace(/\n{3,}/g, "\n\n");

  // ── Trim ──────────────────────────────────────────────────────────────────
  return plain.trim();
}

/**
 * formatResponse(markdownText)
 *
 * Takes raw LLM markdown output and returns both versions.
 *
 * @param {string} markdownText - raw LLM output
 * @returns {{ reply: string, replyPlain: string }}
 *
 * reply      → original markdown  (Next.js / web)
 * replyPlain → stripped plain text (React Native / mobile)
 */
export function formatResponse(markdownText) {
  const reply = (markdownText || "").trim();
  const replyPlain = stripMarkdown(reply);

  return { reply, replyPlain };
}

/**
 * formatGuardrailResponse(text)
 *
 * Guardrail responses are already written in plain text with emojis.
 * This just ensures consistency — no stripping needed for plain,
 * but we lightly format for markdown display.
 *
 * @param {string} text - guardrail response string
 * @returns {{ reply: string, replyPlain: string }}
 */
export function formatGuardrailResponse(text) {
  const reply = (text || "").trim();
  // Guardrail responses use emojis + line breaks — readable as-is on both platforms
  const replyPlain = reply;
  return { reply, replyPlain };
}
