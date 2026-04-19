import {
  Annotation,
  messagesStateReducer,
} from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});
