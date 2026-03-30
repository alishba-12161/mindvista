MindVista – Smart AI Support Assistant
A full-stack RAG-powered chatbot that answers questions strictly from user-provided content.

Tech Stack
Layer	Technology
Frontend	Next.js 14, React 18, Tailwind CSS
Backend	Python 3.11, FastAPI, Uvicorn
Embeddings	sentence-transformers (all-MiniLM-L6-v2, runs locally)
Vector Search	FAISS (in-memory, cosine similarity)
LLM	Groq API (llama-3.3-70b-versatile)
Project Structure
mindvista/
├── backend/
│   ├── main.py        # FastAPI app and routes
│   ├── rag.py         # RAG engine (embed, index, retrieve, answer)
│   ├── chunker.py     # Text chunking logic
│   ├── requirements.txt
│   └── .env           # Your Groq API key (not committed)
├── frontend/
│   ├── app/
│   │   ├── ingest/page.tsx   # Knowledge input page
│   │   └── chat/page.tsx     # Chat interface page
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── FileUpload.tsx
│   └── lib/api.ts     # API client
└── README.md
Setup Instructions
1. Clone the repository
git clone https://github.com/YOUR_USERNAME/mindvista.git
cd mindvista
2. Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
Create a .env file inside the backend folder:

GROQ_API_KEY=your_groq_key_here
Get a free API key from console.groq.com

Run the server:

uvicorn main:app --reload --port 8000
3. Frontend
cd frontend
npm install
npm run dev
Open http://localhost:3000

How It Works
Ingestion — Content is split into 500-word overlapping chunks. Each chunk is embedded using all-MiniLM-L6-v2 and stored in a FAISS vector index.

Retrieval — The user's question is embedded with the same model. FAISS finds the top-4 most similar chunks using cosine similarity.

Generation — Retrieved chunks are passed to Groq's LLM with a strict prompt that instructs it to answer only from the provided context.

Fallback — If no chunks meet the similarity threshold (0.25), the system returns: "I don't have enough information to answer that." without calling the LLM.

API Endpoints
Method	Endpoint	Description
POST	/ingest	Upload text or .txt file to build the knowledge base
POST	/ask	Ask a question and get a grounded answer
GET	/status	Check if content has been indexed
DELETE	/reset	Clear the knowledge base
Assumptions
Content is English text
FAISS index is in-memory and resets on server restart
Only .txt file uploads are supported
Possible Improvements
Persist FAISS index to disk between restarts
Stream LLM responses with Server-Sent Events
Support PDF and DOCX uploads
Add per-session isolation for multiple users
Re-rank retrieved chunks with a cross-encoder