import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const scopePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Du ska bara avgöra om frågan handlar om Språkverkstan AB:s kurser, priser, längd, certifiering, avbokning, material, progression eller studieplan.
Svara exakt: IN_SCOPE eller OUT_OF_SCOPE.`,
  ],
  ["human", "{input}"],
]);

export async function isInScope(input) {
  const llm = new ChatOllama({
    baseUrl: import.meta.env.VITE_OLLAMA_BASE_URL || "http://localhost:11434",
    model: import.meta.env.VITE_OLLAMA_CHAT_MODEL || "llama3.1",
    temperature: 0,
  });

  const prompt = await scopePrompt.formatMessages({ input });
  const res = await llm.invoke(prompt);
  const text = String(res.content || "").trim();
  return text.includes("IN_SCOPE");
}
