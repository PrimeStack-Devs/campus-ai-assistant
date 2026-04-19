import { getWebAnswer } from "../../../webCache.js";

export async function retrieveWebAnswer(query) {
  return await getWebAnswer(query);
}
