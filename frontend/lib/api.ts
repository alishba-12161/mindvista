import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const client = axios.create({ baseURL: BASE });

export async function ingestText(text: string) {
  const form = new FormData();
  form.append("text", text);
  const { data } = await client.post("/ingest", form);
  return data as { message: string; chunk_count: number };
}

export async function ingestFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await client.post("/ingest", form);
  return data as { message: string; chunk_count: number };
}

export async function askQuestion(question: string) {
  const { data } = await client.post("/ask", { question });
  return data as { answer: string; retrieved_chunks: number };
}

export async function resetKnowledge() {
  await client.delete("/reset");
}

export async function getStatus() {
  const { data } = await client.get("/status");
  return data as { indexed: boolean; chunk_count: number };
}