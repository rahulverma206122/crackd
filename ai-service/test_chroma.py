from chroma_service import (
    add_documents,
    search_documents,
    get_collection_count,
)


# ============================================================
# TEST DOCUMENTS
# ============================================================

documents = [
    "Rahul built a MERN stack e-commerce application using React, Node.js, Express.js and MongoDB.",
    "The e-commerce application included PayPal sandbox payment integration.",
    "Rahul has experience with Python, OpenAI API, LangChain, LangGraph and Retrieval-Augmented Generation.",
]


ids = [
    "test_resume_1",
    "test_resume_2",
    "test_resume_3",
]


metadatas = [
    {
        "source_id": "test_resume",
        "source_type": "resume",
        "chunk_index": 0,
    },
    {
        "source_id": "test_resume",
        "source_type": "resume",
        "chunk_index": 1,
    },
    {
        "source_id": "test_resume",
        "source_type": "resume",
        "chunk_index": 2,
    },
]


# ============================================================
# STORE DOCUMENTS
# ============================================================

print("\nAdding documents to ChromaDB...")

result = add_documents(
    documents=documents,
    ids=ids,
    metadatas=metadatas,
)

print(result)


# ============================================================
# COLLECTION COUNT
# ============================================================

count = get_collection_count()

print(
    f"\nTotal chunks in ChromaDB: {count}"
)


# ============================================================
# SEARCH
# ============================================================

query = "What technologies did Rahul use to build his e-commerce application?"

print(
    f"\nSearching ChromaDB for:\n{query}\n"
)

results = search_documents(
    query=query,
    n_results=3,
)


# ============================================================
# DISPLAY RESULTS
# ============================================================

print("Retrieved documents:\n")

for index, result in enumerate(results, start=1):

    print(
        f"--- Result {index} ---"
    )

    print(
        "ID:",
        result["id"]
    )

    print(
        "Document:",
        result["document"]
    )

    print(
        "Metadata:",
        result["metadata"]
    )

    print(
        "Distance:",
        result["distance"]
    )

    print()