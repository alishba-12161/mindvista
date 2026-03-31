# MindVista – Smart AI Support Assistant

MindVista is a full-stack web application that lets you upload any text content and instantly chat with an AI that answers questions strictly based on what you provided (no hallucinations, no external knowledge).

Built as part of a technical assessment for the Associate Software Engineer (AI/ML + MERN) role.

---

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Backend:** Python 3.11, FastAPI
- **Embeddings:** `sentence-transformers` — `all-MiniLM-L6-v2` (runs fully locally)
- **Vector Search:** FAISS (in-memory, cosine similarity)
- **LLM:** Groq API — `llama-3.3-70b-versatile` (free tier)

---

## How It Works

This project implements a basic RAG (Retrieval-Augmented Generation) pipeline:

1. **Ingest** — Your content is split into 500-word overlapping chunks. Each chunk gets embedded into a 384-dimensional vector using `all-MiniLM-L6-v2` and stored in a FAISS index.

2. **Retrieve** — When you ask a question, it gets embedded with the same model. FAISS finds the top-4 most semantically similar chunks using cosine similarity.

3. **Generate** — The retrieved chunks are passed to Groq's LLM with a strict prompt: answer only from the context provided, nothing else.

4. **Fallback** — If no chunks score above the similarity threshold (0.25), the system responds with `"I don't have enough information to answer that."` — without even calling the LLM.

---

## Project Structure
```
mindvista/
├── backend/
│   ├── main.py           # FastAPI routes
│   ├── rag.py            # Core RAG logic (embed, index, retrieve, generate)
│   ├── chunker.py        # Text chunking
│   ├── requirements.txt
│   └── .env              # Groq API key (not committed)
├── frontend/
│   ├── app/
│   │   ├── ingest/       # Knowledge input page
│   │   └── chat/         # Chat interface
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── FileUpload.tsx
│   └── lib/api.ts        # API client
└── README.md
```

---

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/alishba-12161/mindvista.git
cd mindvista
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder:
```
GROQ_API_KEY=your_groq_key_here
```

Get a free API key from [console.groq.com](https://console.groq.com) — no credit card needed.

Start the server:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ingest` | Upload text or `.txt` file |
| POST | `/ask` | Ask a question |
| GET | `/status` | Check if content is indexed |
| DELETE | `/reset` | Clear the knowledge base |

---

## Assumptions

- Content is expected to be in English
- The FAISS index lives in memory and resets when the server restarts
- Only `.txt` file uploads are supported for now

## Possible Improvements

- Persist the FAISS index to disk so it survives server restarts
- Stream LLM responses using Server-Sent Events for a better UX
- Add PDF and DOCX support
- Isolate knowledge bases per user session
- Use a cross-encoder re-ranker on top of FAISS for better retrieval precision
