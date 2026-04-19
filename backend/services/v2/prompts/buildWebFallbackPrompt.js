import { WEB_FALLBACK_SYSTEM_PROMPT } from "../../../utils/prompts.js";

const GENERIC_LIST_INSTRUCTION = `
ADDITIONAL RESPONSE RULES FOR LIST-HEAVY PAGES
- If the content is a long list, do not copy the full list into the answer.
- Summarise the main pattern first, then include only 3-6 representative examples.
- Prefer grouping examples by type when the student asked a broad question.
- Do not add filler lines such as "These are just a few..." or congratulatory intros.
- Do not add caution notes for official sources unless explicitly instructed.
`.trim();

export function buildWebFallbackPrompt(webAnswer, userQuery) {
  const queryLower = userQuery.toLowerCase();
  const isStudentAchievementsSource =
    webAnswer.source_id === "src_student_achievements";

  if (isStudentAchievementsSource) {
    return `${WEB_FALLBACK_SYSTEM_PROMPT}

SOURCE-SPECIFIC INSTRUCTION: STUDENT ACHIEVEMENTS
- The student is asking about Parul University student achievements.
- Give a short summary first covering the kinds of achievements visible on the page.
- Group the highlights into simple themes like placements, competitions, internships, research, entrepreneurship, robotics, public speaking, or cultural achievements when relevant.
- Mention only 4-6 representative highlights unless the student explicitly asks for the full list.
- If the student asks for "latest" or "recent" achievements, prioritise the most recent dated items visible in the provided content.
- Keep the answer natural, warm, and easy to read in 1 short paragraph or a very short bullet list.

${GENERIC_LIST_INSTRUCTION}`;
  }

  const looksLikeBroadAchievementsQuery =
    queryLower.includes("achievement") &&
    !/\b(latest|recent|specific|all)\b/i.test(userQuery);

  if (looksLikeBroadAchievementsQuery) {
    return `${WEB_FALLBACK_SYSTEM_PROMPT}

${GENERIC_LIST_INSTRUCTION}`;
  }

  return WEB_FALLBACK_SYSTEM_PROMPT;
}
