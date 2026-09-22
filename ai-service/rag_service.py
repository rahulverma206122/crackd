from typing import Dict, Any

from document_processor import prepare_document
from chroma_service import (
    add_documents,
    delete_by_source,
    search_documents,
)


# ============================================================
# INDEX DOCUMENT
# ============================================================

def index_document(
    source_id: str,
    source_type: str,
    text: str,
) -> Dict[str, Any]:
    """
    Prepare and store a resume or job description
    inside ChromaDB.
    """

    if not source_id:
        raise ValueError(
            "source_id is required"
        )

    if not source_type:
        raise ValueError(
            "source_type is required"
        )

    if not text or not text.strip():
        raise ValueError(
            "Document text cannot be empty"
        )

    # --------------------------------------------------------
    # PREPARE DOCUMENT
    # --------------------------------------------------------

    prepared = prepare_document(
        text=text,
        source_id=source_id,
        source_type=source_type,
    )

    chunks = prepared["chunks"]

    if not chunks:
        raise ValueError(
            "No usable chunks were created from the document"
        )

    # --------------------------------------------------------
    # REMOVE OLD VERSION
    # --------------------------------------------------------

    delete_by_source(
        source_id=str(source_id)
    )

    # --------------------------------------------------------
    # STORE NEW CHUNKS
    # --------------------------------------------------------

    result = add_documents(
        documents=chunks,
        ids=prepared["ids"],
        metadatas=prepared["metadatas"],
    )

    return {
        "success": True,
        "source_id": str(source_id),
        "source_type": source_type,
        "chunk_count": len(chunks),
        "stored": result["count"],
    }


# ============================================================
# RETRIEVE RELEVANT CONTEXT
# ============================================================

def retrieve_context(
    query: str,
    n_results: int = 5,
    source_id: str | None = None,
    source_type: str | None = None,
):
    """
    Retrieve the most relevant chunks from ChromaDB.
    """

    where = None

    # --------------------------------------------------------
    # FILTER BY SOURCE
    # --------------------------------------------------------

    if source_id and source_type:
        where = {
            "$and": [
                {
                    "source_id": str(source_id)
                },
                {
                    "source_type": source_type
                },
            ]
        }

    elif source_id:
        where = {
            "source_id": str(source_id)
        }

    elif source_type:
        where = {
            "source_type": source_type
        }

    # --------------------------------------------------------
    # SEARCH
    # --------------------------------------------------------

    results = search_documents(
        query=query,
        n_results=n_results,
        where=where,
    )

    return results


# ============================================================
# BUILD CONTEXT STRING
# ============================================================

def build_context(
    results,
) -> str:
    """
    Convert retrieved ChromaDB results into
    a context string that can be supplied
    to an LLM.
    """

    if not results:
        return ""

    context_parts = []

    for index, result in enumerate(
        results,
        start=1,
    ):
        document = result.get(
            "document",
            "",
        )

        metadata = result.get(
            "metadata",
            {},
        )

        source_type = metadata.get(
            "source_type",
            "document",
        )

        context_parts.append(
            f"""
[Context {index}]
Source Type: {source_type}

{document}
""".strip()
        )

    return "\n\n".join(
        context_parts
    )


# ============================================================
# RETRIEVE CONTEXT FOR AI
# ============================================================

def retrieve_ai_context(
    query: str,
    n_results: int = 5,
    source_id: str | None = None,
    source_type: str | None = None,
) -> Dict[str, Any]:
    """
    Retrieve relevant information and return
    both raw results and an LLM-ready context.
    """

    results = retrieve_context(
        query=query,
        n_results=n_results,
        source_id=source_id,
        source_type=source_type,
    )

    context = build_context(
        results
    )

    return {
        "query": query,
        "results": results,
        "context": context,
        "result_count": len(results),
    }