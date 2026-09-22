from typing import TypedDict


class InterviewState(TypedDict, total=False):
    # ---------------------------------------------------------
    # Basic interview information
    # ---------------------------------------------------------

    resume_text: str
    job_description: str
    interview_type: str

    # ---------------------------------------------------------
    # RAG source IDs
    # These connect the interview to ChromaDB documents
    # ---------------------------------------------------------

    resume_source_id: str | None
    job_description_source_id: str | None

    # ---------------------------------------------------------
    # Retrieved RAG context
    # ---------------------------------------------------------

    resume_context: str
    job_description_context: str
    rag_context: str

    # ---------------------------------------------------------
    # Interview questions
    # ---------------------------------------------------------

    current_question: str
    current_difficulty: str

    questions: list[dict]
    previous_questions: list[str]

    # ---------------------------------------------------------
    # Candidate answer
    # ---------------------------------------------------------

    answer: str

    # ---------------------------------------------------------
    # Answer evaluation
    # ---------------------------------------------------------

    score: int
    answer_match: bool
    correct_answer: str

    # ---------------------------------------------------------
    # Previous performance
    # Used for adaptive difficulty
    # ---------------------------------------------------------

    previous_performance: list[dict]

    # ---------------------------------------------------------
    # Interview progress
    # ---------------------------------------------------------

    question_number: int
    total_questions: int

    # ---------------------------------------------------------
    # Final result / errors
    # ---------------------------------------------------------

    evaluation: dict
    error: str | None