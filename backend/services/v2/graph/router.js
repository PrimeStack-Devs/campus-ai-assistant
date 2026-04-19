import { NOT_FOUND_IN_DATA } from "../constants/graphSignals.js";

export function routeAfterLocalSearch(state) {
  const lastMsg = state.messages[state.messages.length - 1];

  return lastMsg.content.trim() === NOT_FOUND_IN_DATA
    ? "web_search"
    : "__end__";
}
