import { MemorySaver, StateGraph } from "@langchain/langgraph";
import { callLocalData } from "../nodes/callLocalData.js";
import { callWebSearch } from "../nodes/callWebSearch.js";
import { routeAfterLocalSearch } from "./router.js";
import { GraphState } from "./state.js";

const workflow = new StateGraph(GraphState)
  .addNode("local_search", callLocalData)
  .addNode("web_search", callWebSearch)
  .setEntryPoint("local_search")
  .addConditionalEdges("local_search", routeAfterLocalSearch)
  .addEdge("web_search", "__end__");

const checkpointer = new MemorySaver();

export const campusBot = workflow.compile({ checkpointer });
