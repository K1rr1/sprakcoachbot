import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { qaPrompt, planPrompt } from "./prompts";
import { getRetriever } from "./retriever";
import { history } from "./memory";
import { isInScope } from "./scopeCheck";

function docsToContext(docs) {
  return docs
    .map((d, i) => {
      const src = d.metadata?.source ? ` (${d.metadata.source})` : "";
      return `Källa ${i + 1}${src}:\n${d.pageContent}`;
    })
    .join("\n\n");
}

async function historyToText() {
  const msgs = await history.getMessages();
  return msgs
    .map((m) => {
      const role = m._getType?.() === "human" ? "User" : "Assistant";
      return `${role}: ${m.content}`;
    })
    .join("\n");
}

export async function askCoach({ mode, input }) {
  // 1) Scope-check (stoppa irrelevanta frågor)
  const ok = await isInScope(input);
  if (!ok) {
    const refusal =
      "Jag kan tyvärr bara hjälpa till med frågor om Språkverkstan AB:s kurser, priser, kurslängd, material, progression, certifiering och avbokningspolicy – eller skapa en studieplan utifrån det. Ställ gärna en fråga inom det området.";
    await history.addUserMessage(input);
    await history.addAIMessage(refusal);
    return { answer: refusal, sources: [] };
  }

  // 2) Hämta relevanta källor från Supabase (RAG)
  const retriever = await getRetriever();
  const docs = await retriever.getRelevantDocuments(input);
  const context = docsToContext(docs);

  // 3) Bygg prompt
  const chat_history = await historyToText();

  const llm = new ChatOllama({
    baseUrl: import.meta.env.VITE_OLLAMA_BASE_URL || "http://localhost:11434",
    model: import.meta.env.VITE_OLLAMA_CHAT_MODEL || "llama3.1",
    temperature: 0.2,
  });

  const prompt = mode === "plan" ? planPrompt : qaPrompt;
  const messages = await prompt.formatMessages({ context, chat_history, input });

  // 4) Kör LLM
  const parser = new StringOutputParser();
  const res = await llm.invoke(messages);
  const answer = await parser.invoke(res);

  // 5) Uppdatera minnet (session)
  await history.addUserMessage(input);
  await history.addAIMessage(answer);

  // 6) Skicka tillbaka + källor (för UI)
  const sources = docs.map((d) => ({
    source: d.metadata?.source || "okänd källa",
    snippet: d.pageContent.slice(0, 220) + (d.pageContent.length > 220 ? "..." : ""),
  }));

  return { answer, sources };
}
