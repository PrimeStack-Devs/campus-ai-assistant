import {
  CAMPUS_ASSISTANT_SYSTEM_PROMPT,
  FORMAT_DIRECTIONS,
  FORMAT_LOCATION,
  FORMAT_PERSON,
  FORMAT_POLICY,
  FORMAT_SERVICE,
} from "../../../utils/prompts.js";

const FORMAT_MAP = {
  location: FORMAT_LOCATION,
  directions: FORMAT_DIRECTIONS,
  person: FORMAT_PERSON,
  service: FORMAT_SERVICE,
  policy: FORMAT_POLICY,
};

export function buildSystemPrompt(queryType) {
  const template = FORMAT_MAP[queryType];
  if (!template) return CAMPUS_ASSISTANT_SYSTEM_PROMPT;

  return `${CAMPUS_ASSISTANT_SYSTEM_PROMPT}\n\n${template}`;
}
