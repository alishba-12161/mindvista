from fastapi.responses import StreamingResponse
"""
MindVista – FastAPI backend
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import rag

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s │ %(name)s │ %(message)s")
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("MindVista backend starting…")
    yield
    logger.info("MindVista backend shutting down.")


app = FastAPI(title="MindVista API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    retrieved_chunks: int


class IngestResponse(BaseModel):
    message: str
    chunk_count: int


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"service": "MindVista API", "version": "1.0.0"}


@app.get("/status")
def get_status():
    return rag.status()


@app.post("/ingest", response_model=IngestResponse)
async def ingest(
    text: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
):
    """
    Accept raw text or a .txt file upload, chunk it, and build the vector index.
    """
    content: str = ""

    if file is not None:
        if not file.filename.endswith(".txt"):
            raise HTTPException(status_code=400, detail="Only .txt files are supported.")
        raw_bytes = await file.read()
        try:
            content = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File must be UTF-8 encoded.")
    elif text:
        content = text.strip()
    else:
        raise HTTPException(status_code=400, detail="Provide either 'text' or a file upload.")

    if len(content) < 20:
        raise HTTPException(status_code=400, detail="Content is too short to be useful.")

    try:
        chunk_count = rag.ingest(content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return IngestResponse(
        message="Content processed and indexed successfully.",
        chunk_count=chunk_count,
    )


@app.post("/ask", response_model=AskResponse)
def ask(body: AskRequest):
    """
    Answer a question strictly from the indexed content.
    """
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    status = rag.status()
    if not status["indexed"]:
        raise HTTPException(status_code=400, detail="No content has been ingested yet. Go to /ingest first.")

    try:
        answer_text = rag.answer(body.question)
        retrieved = len(rag.retrieve(body.question))
    except EnvironmentError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return AskResponse(answer=answer_text, retrieved_chunks=retrieved)


@app.delete("/reset")
def reset():
    """Clear all indexed content."""
    rag.reset()
    return {"message": "Knowledge base cleared."}

@app.post("/ask-stream")
def ask_stream(body: AskRequest):
    """
    Stream the answer token by token using Server-Sent Events.
    """
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    status = rag.status()
    if not status["indexed"]:
        raise HTTPException(status_code=400, detail="No content has been ingested yet.")

    def event_stream():
        try:
            for token in rag.answer_stream(body.question):
                yield f"data: {token}\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")