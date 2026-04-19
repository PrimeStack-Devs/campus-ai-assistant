import { applyGuardrails } from "../../../utils/guardrails.js";

export function runGuardrails(userMessage) {
  const guardrail = applyGuardrails(userMessage);

  if (!guardrail) return null;

  console.log(
    `[Guardrail] Intercepted | tier: ${guardrail.tier} | id: ${guardrail.id}`,
  );

  return {
    response: guardrail.response,
    metadata: {
      guardrail: true,
      tier: guardrail.tier,
      id: guardrail.id,
      is_critical: guardrail.is_critical,
      source: "guardrail",
    },
  };
}
