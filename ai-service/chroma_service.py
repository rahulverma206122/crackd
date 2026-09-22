import os
from typing import List, Dict, Any, Optional

import chromadb
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# LOCAL EMBEDDING MODEL
# ============================================================

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

print(
    f"Loading embedding model: {EMBEDDING_MODEL_NAME}"
)

embedding_model = SentenceTransformer(
    EMBEDDING_MODEL_NAME
)

print("Embedding model loaded successfully.")


# ============================================================
# CHROMADB
# ============================================================

CHROMA_PATH = os.path.join(
    os.path.dirname(__file__),
    "chroma_data"
)

chroma_client = chromadb.PersistentClient(
    path=CHROMA_PATH
)


# ============================================================
# COLLECTION
# ============================================================

collection = chroma_client.get_or_create_collection(
    name="crackd_documents",
    metadata={
        "description": (
            "Resume and job description "
            "knowledge base for Crackd.ai"
        )
    },
)


# ============================================================
# CREATE EMBEDDING
# ============================================================

def create_embedding(text: str) -> List[float]:
    """
    Convert text into an embedding vector
    using a local Sentence Transformer model.
    """

    if not text or not text.strip():
        raise ValueError(
            "Text cannot be empty when creating an embedding"
        )

    embedding = embedding_model.encode(
        text.strip(),
        normalize_embeddings=True,
    )

    return embedding.tolist()


# ============================================================
# ADD SINGLE DOCUMENT
# ============================================================

def add_document(
    document_id: str,
    text: str,
    metadata: Dict[str, Any],
):
    """
    Store one document chunk in ChromaDB.
    """

    if not document_id:
        raise ValueError(
            "document_id is required"
        )

    if not text or not text.strip():
        raise ValueError(
            "Document text cannot be empty"
        )

    embedding = create_embedding(text)

    collection.upsert(
        ids=[document_id],
        documents=[text.strip()],
        embeddings=[embedding],
        metadatas=[metadata],
    )

    return {
        "success": True,
        "id": document_id,
    }


# ============================================================
# ADD MULTIPLE DOCUMENT CHUNKS
# ============================================================

def add_documents(
    documents: List[str],
    ids: List[str],
    metadatas: List[Dict[str, Any]],
):
    """
    Store multiple document chunks in ChromaDB.
    """

    if not documents:
        raise ValueError(
            "Documents list cannot be empty"
        )

    if len(documents) != len(ids):
        raise ValueError(
            "documents and ids must have the same length"
        )

    if len(documents) != len(metadatas):
        raise ValueError(
            "documents and metadatas must have the same length"
        )

    cleaned_documents = [
        document.strip()
        for document in documents
    ]

    for document in cleaned_documents:
        if not document:
            raise ValueError(
                "Document text cannot be empty"
            )

    embeddings = [
        create_embedding(document)
        for document in cleaned_documents
    ]

    collection.upsert(
        ids=ids,
        documents=cleaned_documents,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    return {
        "success": True,
        "count": len(documents),
    }


# ============================================================
# SEARCH DOCUMENTS
# ============================================================

def search_documents(
    query: str,
    n_results: int = 5,
    where: Optional[Dict[str, Any]] = None,
):
    """
    Search ChromaDB for the most relevant
    document chunks.
    """

    if not query or not query.strip():
        raise ValueError(
            "Query cannot be empty"
        )

    collection_count = collection.count()

    if collection_count == 0:
        return []

    n_results = min(
        n_results,
        collection_count,
    )

    query_embedding = create_embedding(query)

    query_arguments = {
        "query_embeddings": [query_embedding],
        "n_results": n_results,
    }

    if where:
        query_arguments["where"] = where

    results = collection.query(
        **query_arguments
    )

    documents = results.get(
        "documents",
        [[]],
    )[0]

    metadatas = results.get(
        "metadatas",
        [[]],
    )[0]

    distances = results.get(
        "distances",
        [[]],
    )[0]

    ids = results.get(
        "ids",
        [[]],
    )[0]

    matches = []

    for index in range(len(documents)):
        matches.append(
            {
                "id": ids[index],
                "document": documents[index],
                "metadata": metadatas[index],
                "distance": distances[index],
            }
        )

    return matches


# ============================================================
# DELETE DOCUMENTS
# ============================================================

def delete_documents(
    ids: List[str],
):
    """
    Delete specific document chunks
    from ChromaDB.
    """

    if not ids:
        return {
            "success": True,
            "deleted": 0,
        }

    collection.delete(
        ids=ids
    )

    return {
        "success": True,
        "deleted": len(ids),
    }


# ============================================================
# DELETE BY SOURCE
# ============================================================

def delete_by_source(
    source_id: str,
):
    """
    Delete all chunks belonging to
    a specific source document.
    """

    if not source_id:
        raise ValueError(
            "source_id is required"
        )

    existing = collection.get(
        where={
            "source_id": source_id
        }
    )

    ids = existing.get(
        "ids",
        []
    )

    if ids:
        collection.delete(
            ids=ids
        )

    return {
        "success": True,
        "deleted": len(ids),
    }


# ============================================================
# COLLECTION INFO
# ============================================================

def get_collection_count() -> int:
    """
    Return the number of stored chunks.
    """

    return collection.count()