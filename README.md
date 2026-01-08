## Köra appen 

För att appen ska fungera behöver man:
- en Supabase-projekt med tabellen documents + funktionen match_documents (SQL finns i längst ner i README)
- en .env (kopiera .env.example) med Supabase URL + keys fyll i värden
- Ollama igång lokalt (ollama serve) + modeller installerade

Steg:
1) npm install
2) Skapa .env från .env.example och fyll i värden (Supabase: Project Settings → API settings)
3) Lägg text i data/sprakverkstan.txt
4) node scripts/ingest.js för och fylla tabbelen som skapas av SQL blocket
5) ollama serve (i separat terminal,glömmer alltid detta)
6) npm run dev


 SQL Blocket :

 create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb,
  embedding vector(768)
);

create or replace function public.match_documents (
  query_embedding vector(768),
  match_count int default 5,
  filter jsonb default '{}'::jsonb
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where (filter = '{}'::jsonb or d.metadata @> filter)
  order by d.embedding <=> query_embedding
  limit match_count;
$$;
