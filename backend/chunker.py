"""
Text chunking utilities.
Splits content into overlapping windows so context is preserved across chunk boundaries.
"""

from typing import List


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Split text into overlapping chunks by word count.

    Args:
        text: Raw input text.
        chunk_size: Target word count per chunk.
        overlap: Number of words shared between adjacent chunks.

    Returns:
        List of text chunk strings.
    """
    words = text.split()
    if not words:
        return []

    chunks: List[str] = []
    start = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)

        if end == len(words):
            break

        start += chunk_size - overlap

    return chunks