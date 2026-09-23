import re

from typing import List, Dict, Any


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text: str) -> str:
    """
    Clean extracted resume or job-description text.
    """

    if not text:
        return ""

    # Normalize line endings
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Normalize tabs and excessive spaces
    text = re.sub(r"[ \t]+", " ", text)

    # Remove spaces from the beginning/end of each line
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n[ \t]+", "\n", text)

    # Remove excessive blank lines
    text = re.sub(r"\n\s*\n+", "\n\n", text)

    return text.strip()


# ============================================================
# TEXT CHUNKING
# ============================================================

def chunk_text(
    text: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150,
) -> List[str]:
    """
    Split long text into overlapping chunks.

    chunk_size:
        Approximate maximum number of words per chunk.

    chunk_overlap:
        Number of words repeated between consecutive chunks.
    """

    text = clean_text(text)

    if not text:
        return []

    if chunk_size <= 0:
        raise ValueError(
            "chunk_size must be greater than 0"
        )

    if chunk_overlap < 0:
        raise ValueError(
            "chunk_overlap cannot be negative"
        )

    if chunk_overlap >= chunk_size:
        raise ValueError(
            "chunk_overlap must be smaller than chunk_size"
        )

    words = text.split()

    chunks = []

    start = 0

    while start < len(words):

        end = min(
            start + chunk_size,
            len(words),
        )

        chunk = " ".join(
            words[start:end]
        ).strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(words):
            break

        start = end - chunk_overlap

    return chunks


# ============================================================
# CREATE CHUNK METADATA
# ============================================================

def create_chunk_metadata(
    source_id: str,
    source_type: str,
    chunks: List[str],
) -> List[Dict[str, Any]]:
    """
    Create metadata for each document chunk.
    """

    metadata = []

    for index, _ in enumerate(chunks):

        metadata.append(
            {
                "source_id": str(source_id),
                "source_type": source_type,
                "chunk_index": index,
            }
        )

    return metadata


# ============================================================
# PREPARE DOCUMENT
# ============================================================

def prepare_document(
    text: str,
    source_id: str,
    source_type: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150,
) -> Dict[str, Any]:
    """
    Clean, chunk, and prepare a resume or
    job description for vector storage.
    """

    if not source_id:
        raise ValueError(
            "source_id is required"
        )

    if not source_type:
        raise ValueError(
            "source_type is required"
        )

    cleaned_text = clean_text(text)

    if not cleaned_text:
        raise ValueError(
            "Document text cannot be empty"
        )

    chunks = chunk_text(
        cleaned_text,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

    if not chunks:
        raise ValueError(
            "No usable chunks were created from the document"
        )

    metadata = create_chunk_metadata(
        source_id=source_id,
        source_type=source_type,
        chunks=chunks,
    )

    ids = [
        f"{source_type}_{source_id}_chunk_{index}"
        for index in range(len(chunks))
    ]

    return {
        "source_id": str(source_id),
        "source_type": source_type,
        "text": cleaned_text,
        "chunks": chunks,
        "ids": ids,
        "metadatas": metadata,
        "chunk_count": len(chunks),
    }