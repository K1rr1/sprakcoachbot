import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Saknar SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const txtPath = path.join(__dirname, "..", "data", "sprakverkstan.txt");
  const raw = fs.readFileSync(txtPath, "utf-8");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 900,
    chunkOverlap: 150,
  });

  const docs = await splitter.createDocuments([raw], [
    { source: "sprakverkstan.txt" },
  ]);

  const embeddings = new OllamaEmbeddings({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
  });

  // Rensa tabellen (valfritt men praktiskt när du testar om)
  await supabase.from("documents").delete().neq("id", 0);

  await SupabaseVectorStore.fromDocuments(docs, embeddings, {
    client: supabase,
    tableName: "documents",
    queryName: "match_documents",
  });

  console.log(`Klart. Sparade ${docs.length} chunks i Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
