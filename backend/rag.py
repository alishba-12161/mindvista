"""
RAG (Retrieval-Augmented Generation) engine.

Workflow:
  ingest  → chunk text → embed chunks → store in FAISS index
  query   → embed question → cosine-nearest chunks → build prompt → LLM
"""

from __future__ import annotations

import os
import logging
import numpy as np
import faiss
from typing import List, Tuple
from sentence_transformers import SentenceTransformer
from groq import Groq

from chunker import chunk_text

logger = logging.getLogger(__name__)

EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
TOP_K = 4
MIN_SCORE = 0.25

_embed_model: SentenceTransformer | None = None
_index: faiss.IndexFlatIP | None = None
_chunks: List[str] = []


def _get_model() -> SentenceTransformer:
    global _embed_model
    if _embed_model is None:
        logger.info("Loading embedding model '%s'…", EMBED_MODEL_NAME)
        _embed_model = SentenceTransformer(EMBED_MODEL_NAME)
    return _embed_model


def _embed(texts: List[str]) -> np.ndarray:
    model = _get_model()
    vecs = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    faiss.normalize_L2(vecs)
    return vecs.astype("float32")


def ingest(text: str) -> int:
    global _index, _chunks

    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("No content could be extracted from the provided text.")

    vecs = _embed(chunks)
    dim = vecs.shape[1]

    _index = faiss.IndexFlatIP(dim)
    _index.add(vecs)
    _chunks = chunks

    logger.info("Indexed %d chunks (dim=%d).", len(chunks), dim)
    return len(chunks)


def retrieve(question: str) -> List[Tuple[str, float]]:
    if _index is None or not _chunks:
        return []

    q_vec = _embed([question])
    scores, indices = _index.search(q_vec, min(TOP_K, len(_chunks)))

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        if float(score) >= MIN_SCORE:
            results.append((_chunks[idx], float(score)))

    return results


def answer(question: str) -> str:
    relevant = retrieve(question)

    if not relevant:
        return "I don't have enough information to answer that."

    context = "\n\n---\n\n".join(chunk for chunk, _ in relevant)

    prompt = f"""You are a precise question-answering assistant.
Answer the user's question using ONLY the context provided below.
If the answer cannot be determined from the context, respond with exactly:
"I don't have enough information to answer that."
Do not add external knowledge or speculation.

<context>
{context}
</context>

Question: {question}
Answer:"""

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError("GROQ_API_KEY is not set.")

    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024,
    )
    return response.choices[0].message.content.strip()


def reset() -> None:
    global _index, _chunks
    _index = None
    _chunks = []
    logger.info("Vector store cleared.")


def status() -> dict:
    return {
        "indexed": _index is not None,
        "chunk_count": len(_chunks),
    }
