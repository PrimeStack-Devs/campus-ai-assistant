/**
 * guardrails.js
 * Parul University Smart Campus Assistant
 *
 * Pre-graph guardrail layer. Call applyGuardrails(query) BEFORE
 * the LangGraph workflow runs. If it returns a result, short-circuit
 * the graph and return that response directly to the user.
 *
 * Three tiers:
 *   BLOCKED    → hard stop, no LLM call at all
 *   SENSITIVE  → immediate empathetic response + redirect
 *   OFF_TOPIC  → polite redirect back to campus topics
 */

// ─── Tier 1: Blocked Topics ───────────────────────────────────────────────────

const BLOCKED_PATTERNS = [
  // Harmful content
  /\b(how to (make|build|create|synthesize) (bomb|weapon|drug|poison|explosive))\b/i,
  /\b(hack|exploit|crack|bypass) (the|parul|university|server|system|wifi|portal)\b/i,
  /\b(child abuse|child porn|csam)\b/i,
  /\b(terrorist|terrorism)\b/i,

  // Exam malpractice
  /\b(how to cheat|cheat in exam|copy in exam|unfair means trick)\b/i,
  /\b(get fake (marksheet|certificate|degree|result))\b/i,

  // Personal data extraction
  /\b(give me (all|list of) (student|faculty|staff) (data|phone|email|number|address))\b/i,
  /\b(student database|faculty database|dump (all|the) data)\b/i,

  // Prompt injection
  /\b(ignore (previous|all|above) instructions)\b/i,
  /\b(pretend you are|act as|roleplay as|forget you are)\b/i,
  /\b(jailbreak|DAN mode|developer mode|unrestricted mode)\b/i,
  /\b(repeat (your|the) (system|prompt|instructions) (back|to me|above))\b/i,
  /\b(what (is|are) your (system prompt|instructions|rules|constraints))\b/i,
];

// ─── Tier 2: Sensitive Topics ─────────────────────────────────────────────────

const SENSITIVE_TOPICS = [
  {
    id: "suicidal_ideation",
    patterns: [
      /\b(suicid(e|al)|want to die|end my life|kill myself|self harm|cut myself)\b/i,
      /\b(don't want to live|no reason to live|life is (pointless|meaningless|not worth))\b/i,
      /\b(hurt(ing)? myself|harm(ing)? myself)\b/i,
    ],
    response: `I'm really concerned about you right now, and I want you to get help immediately.

Please reach out to someone right now:
📞 iCall Helpline (free, confidential): 9152987821
📞 Vandrevala Foundation (24/7): 1860-2662-345
📍 On campus: Insights Centre for Counselling — Building A11, 1st Floor
📍 Medical emergency: Parul Sevashram Hospital (E2) — open 24/7

You matter, and there are people who want to help. Please don't wait.`,
    is_critical: true,
  },

  {
    id: "mental_health",
    patterns: [
      /\b(depressed|depression|anxiety|anxious|panic attack)\b/i,
      /\b(feel(ing)? (hopeless|worthless|empty|numb|broken|lost))\b/i,
      /\b(can't (cope|handle|take it|go on)|overwhelmed|burned out)\b/i,
      /\b(need (someone to talk|emotional support)|nobody cares|all alone on campus)\b/i,
    ],
    response: `Hey, I hear you — and it's okay to not be okay sometimes. The campus has a free, confidential counselling centre specifically for students like you.

📍 Insights Centre for Counselling — Building A11, 1st Floor
⏰ Mon–Fri: 9:00 AM – 5:00 PM | Sat: 9:00 AM – 1:00 PM
📧 counselling@paruluniversity.ac.in

Walk-ins are welcome. You don't have to go through this alone.`,
    is_critical: false,
  },

  {
    id: "ragging",
    patterns: [
      /\b(ragg(ing|ed|er)|being bullied|seniors (harass|trouble|threaten|force))\b/i,
      /\b(harass(ed|ment|ing) by (senior|student|classmate))\b/i,
      /\b(someone (hit|beat|hurt|forced) me (on campus|in hostel|in college))\b/i,
    ],
    response: `This is serious and you did the right thing by speaking up. Parul University has zero tolerance for ragging.

Please report this immediately:
📞 National Anti-Ragging Helpline (free, 24/7): 1800-180-5522
🌐 www.antiragging.in
📍 Office of Student Welfare — Administrative Block C3, Ground Floor
📧 studentwelfare@paruluniversity.ac.in | 📞 02668-260505

Your complaint will be completely confidential. The university will act swiftly.`,
    is_critical: true,
  },

  {
    id: "medical_emergency",
    patterns: [
      /\b(emergency|urgent (medical|help|situation)|accident on campus)\b/i,
      /\b(bleeding|unconscious|fainted|collapsed|can't breathe|chest pain)\b/i,
      /\b(someone is hurt|need ambulance|call (the )?(doctor|hospital) now)\b/i,
    ],
    response: `Go to Parul Sevashram Hospital (E2) immediately — it's open 24/7 for emergencies.

📍 Building E2 — central zone of campus (follow the main road past C1)
📞 Campus Security (nearest gate): 02668-260514

If you cannot walk there, call campus security right now — they will assist immediately.`,
    is_critical: true,
  },

  {
    id: "sexual_harassment",
    patterns: [
      /\b(sexual(ly)? (harass(ed|ment|ing)|assaulted|abused|exploited))\b/i,
      /\b(inappropriate (touch|behaviour|comment)|unwanted (touch|advance|contact))\b/i,
      /\b(internal complaints committee|posh act|icc complaint)\b/i,
    ],
    response: `I'm sorry this happened to you. What you're describing is serious, and you have every right to report it.

Parul University has an Internal Complaints Committee (ICC) under the POSH Act:
📍 Office of Student Welfare — Administrative Block C3, Ground Floor
📧 studentwelfare@paruluniversity.ac.in | 📞 02668-260505

All complaints are handled with complete confidentiality. You can also bring a trusted person with you.`,
    is_critical: true,
  },

  {
    id: "financial_distress",
    patterns: [
      /\b(can't (afford|pay) (fee|fees|tuition|hostel fee))\b/i,
      /\b(no money (for|to pay)|financial (crisis|difficulty|hardship))\b/i,
      /\b(scholarship (not received|delayed|not credited|urgently needed))\b/i,
    ],
    response: `Fee situations can be stressful — here's where you can get help on campus:

📍 Scholarship Section — Administrative Block C1, Ground Floor
📧 scholarship@paruluniversity.ac.in | 📞 02668-260503

📍 Accounts Section (fee queries, payment plans) — C1, Ground Floor
📞 02668-260509

Both offices are open Mon–Sat, 9:00 AM – 5:00 PM. They can walk you through scholarships, fee waivers, and payment options.`,
    is_critical: false,
  },
];

// ─── Tier 3: Off-Topic Patterns ───────────────────────────────────────────────
// ⚠️  Be careful with generic patterns — they can accidentally catch campus queries.
// Rule: always add a negative lookahead for Parul/university context where needed.

const OFF_TOPIC_PATTERNS = [
  // Coding tutorials / general CS (not campus-related)
  /\b(write (a |me )?(code|program|function|script) (for|that|to))\b/i,
  /\b(explain (recursion|sorting algorithm|data structure|neural network|blockchain))\b/i,
  /\b(what is (python|javascript|react|html|css|node\.?js) (used for|language|framework))\b/i,

  // General knowledge — capital/currency/population are never campus queries
  /\b(capital of|currency of|population of)\b/i,

  // "prime minister of" is never campus-related
  /\bprime minister of\b/i,

  // ✅ FIX: "president of" was catching "president of Parul University".
  // Negative lookahead excludes Parul, PU, and "the university" references.
  /\bpresident of\s+(?!parul|pu\b|the university|our university)/i,

  // "who founded" — exclude Parul University references
  /\bwho (invented|discovered|founded)\s+(?!parul|pu\b)/i,

  // Entertainment / sports — clearly off-topic
  /\b(cricket (score|match today|ipl result)|bollywood|movie review|song lyrics)\b/i,
  /\b(stock (market|price)|bitcoin|cryptocurrency)\b/i,
  /\b(recipe (for|of)|how to (cook|make) (food|dish|cake|biryani))\b/i,
  /\b(weather (in|today|tomorrow)|temperature today)\b/i,

  // Personal / relationship advice
  /\b(should i (break up|propose|date)|relationship (advice|problem|issue))\b/i,
  /\b(my (boyfriend|girlfriend|wife|husband) is)\b/i,

  // National politics — exclude scholarship/education policy references
  /\b(modi|bjp|congress|aap|election result|vote for|political party)\b/i,
];

const OFF_TOPIC_RESPONSE = `I'm specifically here to help with everything related to Parul University — locations, departments, services, timings, policies, faculty, and campus life.

That's a bit outside what I can help with. Is there anything about the campus I can assist you with?`;

// ─── Normalize ────────────────────────────────────────────────────────────────

const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// ─── Main Exports ─────────────────────────────────────────────────────────────

/**
 * applyGuardrails(query)
 *
 * Call this BEFORE the LangGraph workflow.
 * Returns a guardrail result to short-circuit the graph,
 * or null if the query is safe to proceed.
 *
 * @param {string} query — raw user message
 * @returns {{ tier, id, response, is_critical } | null}
 */
export function applyGuardrails(query) {
  const normalized = normalize(query);

  // Tier 1 — Blocked (hard stop, no LLM call)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        tier: "blocked",
        id: "blocked_content",
        response:
          "I'm not able to help with that. If you have a campus-related question, I'm happy to assist.",
        is_critical: false,
      };
    }
  }

  // Tier 2 — Sensitive (critical topics checked first — order matters)
  for (const topic of SENSITIVE_TOPICS) {
    for (const pattern of topic.patterns) {
      if (pattern.test(normalized)) {
        return {
          tier: "sensitive",
          id: topic.id,
          response: topic.response,
          is_critical: topic.is_critical || false,
        };
      }
    }
  }

  // Tier 3 — Off-topic (polite redirect)
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        tier: "off_topic",
        id: "off_topic",
        response: OFF_TOPIC_RESPONSE,
        is_critical: false,
      };
    }
  }

  // Safe — proceed to graph
  return null;
}

/**
 * detectQueryType(query)
 *
 * Lightweight classifier to select the right response format template.
 *
 * @param {string} query
 * @returns {"location"|"directions"|"person"|"service"|"policy"|"general"}
 */
export function detectQueryType(query) {
  const q = normalize(query);

  if (
    /\b(how to reach|how do i get|directions? to|route (to|from)|walk(ing)? (to|from)|from (main gate|gate|hostel|block))\b/.test(
      q,
    )
  ) {
    return "directions";
  }

  if (
    /\b(where is|location of|find|how to find|nearest|where (can i find|do i go))\b/.test(
      q,
    )
  ) {
    return "location";
  }

  // ✅ Expanded person detection — covers HOD, dean, president, vice chancellor,
  // registrar, director, and faculty name lookups
  if (
    /\b(who is|hod|head of department|head of|dean|professor|faculty|staff|contact (of|for)|email (of|for)|phone (of|for)|vice chancellor|registrar|director|president of parul|president of pu|chancellor)\b/.test(
      q,
    )
  ) {
    return "person";
  }

  if (
    /\b(timing|timings|open|close|hours|when (does|is|are)|schedule|bus|canteen|mess|library|gym|pool|bank|atm)\b/.test(
      q,
    )
  ) {
    return "service";
  }

  if (
    /\b(rule|policy|attendance|exam (rule|policy)|backlog|atkt|fine|hostel rule|dress code|conduct|scholarship (rule|process|eligibility))\b/.test(
      q,
    )
  ) {
    return "policy";
  }

  return "general";
}
