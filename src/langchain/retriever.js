import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { getSupabaseClient } from "../supabaseClient.js";

export async function getRetriever() {
    const supabase = getSupabaseClient();

    const embeddings = new OllamaEmbeddings({
        baseUrl: import.meta.env.VITE_OLLAMA_BASE_URL || "http://localhost:11434",
        model: import.meta.env.VITE_OLLAMA_EMBED_MODEL || "nomic-embed-text",
    });
     // OBS: här använder vi existing index/table
  const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: supabase,
    tableName: "documents",
    queryName: "match_documents",
  });

  return vectorStore.asRetriever(4);
}