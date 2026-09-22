from typing import Any

from interviewer import (
    start_interview,
    generate_next_batch,
    evaluate_answer,
)

from rag_service import retrieve_ai_context


# ============================================================
# RAG NODE
# ============================================================

def retrieve_interview_context(state: dict) -> dict:
    """
    Retrieve relevant resume and job-description context
    from ChromaDB for the current interview.
    """

    resume_source_id = state.get("resume_source_id")

    job_description_source_id = state.get(
        "job_description_source_id"
    )

    query_parts = [
        state.get("current_question", ""),
        state.get("answer", ""),
        state.get("interview_type", ""),
    ]

    query = " ".join(
        part.strip()
        for part in query_parts
        if isinstance(part, str) and part.strip()
    )

    if not query:
        query = (
            "Resume skills, job description requirements, "
            "technical interview context"
        )

    resume_context = ""
    job_description_context = ""

    # --------------------------------------------------------
    # Resume RAG
    # --------------------------------------------------------

    try:
        if resume_source_id:
            resume_result = retrieve_ai_context(
                query=query,
                n_results=4,
                source_id=resume_source_id,
                source_type="resume",
            )

            resume_context = resume_result.get(
                "context",
                "",
            )

    except Exception as error:
        print(
            "LangGraph resume RAG retrieval error:",
            error,
        )

    # --------------------------------------------------------
    # Job Description RAG
    # --------------------------------------------------------

    try:
        if job_description_source_id:
            jd_result = retrieve_ai_context(
                query=query,
                n_results=4,
                source_id=job_description_source_id,
                source_type="job_description",
            )

            job_description_context = jd_result.get(
                "context",
                "",
            )

    except Exception as error:
        print(
            "LangGraph JD RAG retrieval error:",
            error,
        )

    # --------------------------------------------------------
    # Combine Context
    # --------------------------------------------------------

    combined_context = "\n\n".join(
        context
        for context in [
            resume_context,
            job_description_context,
        ]
        if context
    )

    return {
        "resume_context": resume_context,
        "job_description_context": job_description_context,
        "rag_context": combined_context,
    }


# ============================================================
# QUESTION GENERATION NODE
# ============================================================

def generate_questions_node(state: dict) -> dict:
    """
    Generate the first interview batch using the existing
    interviewer service.
    """

    try:
        result = start_interview(
            resume_text=state.get(
                "resume_text",
                "",
            ),
            job_description=state.get(
                "job_description",
                "",
            ),
            interview_type=state.get(
                "interview_type",
                "technical",
            ),
            resume_source_id=state.get(
                "resume_source_id",
            ),
            job_description_source_id=state.get(
                "job_description_source_id",
            ),
        )

        questions = [
            question.model_dump()
            if hasattr(question, "model_dump")
            else question
            for question in result.questions
        ]

        return {
            "questions": questions,
            "total_questions": len(questions),
            "question_number": 1 if questions else 0,
            "previous_questions": [
                question.get("question", "")
                for question in questions
                if isinstance(question, dict)
            ],
            "error": None,
        }

    except Exception as error:
        print(
            "LangGraph question generation error:",
            error,
        )

        return {
            "questions": [],
            "total_questions": 0,
            "question_number": 0,
            "error": str(error),
        }


# ============================================================
# ANSWER EVALUATION NODE
# ============================================================

def evaluate_answer_node(state: dict) -> dict:
    """
    Evaluate the candidate's current answer.
    """

    try:
        result = evaluate_answer(
            resume_text=state.get(
                "resume_text",
                "",
            ),
            job_description=state.get(
                "job_description",
                "",
            ),
            interview_type=state.get(
                "interview_type",
                "technical",
            ),
            question=state.get(
                "current_question",
                "",
            ),
            answer=state.get(
                "answer",
                "",
            ),
            previous_questions=state.get(
                "previous_questions",
                [],
            ),
            resume_source_id=state.get(
                "resume_source_id",
            ),
            job_description_source_id=state.get(
                "job_description_source_id",
            ),
        )

        evaluation = (
            result.evaluation.model_dump()
            if hasattr(result.evaluation, "model_dump")
            else result.evaluation
        )

        if not isinstance(evaluation, dict):
            evaluation = {}

        score = evaluation.get(
            "score",
            0,
        )

        answer_match = evaluation.get(
            "answer_match",
            False,
        )

        correct_answer = evaluation.get(
            "correct_answer",
            "",
        )

        # ----------------------------------------------------
        # Add the current answer's performance to history.
        # This allows the next difficulty calculation to use
        # the latest answer as well.
        # ----------------------------------------------------

        previous_performance = list(
            state.get(
                "previous_performance",
                [],
            )
        )

        current_performance = {
            "score": score,
            "answer_match": answer_match,
        }

        updated_performance = (
            previous_performance
            + [current_performance]
        )

        return {
            "evaluation": evaluation,
            "score": score,
            "answer_match": answer_match,
            "correct_answer": correct_answer,
            "previous_performance": updated_performance,
            "error": None,
        }

    except Exception as error:
        print(
            "LangGraph answer evaluation error:",
            error,
        )

        return {
            "evaluation": {},
            "score": 0,
            "answer_match": False,
            "correct_answer": "",
            "error": str(error),
        }


# ============================================================
# NEXT QUESTION BATCH NODE
# ============================================================

def generate_next_questions_node(state: dict) -> dict:
    """
    Generate the next interview batch using previous
    performance and adaptive difficulty.
    """

    try:
        result = generate_next_batch(
            resume_text=state.get(
                "resume_text",
                "",
            ),
            job_description=state.get(
                "job_description",
                "",
            ),
            interview_type=state.get(
                "interview_type",
                "technical",
            ),
            previous_questions=state.get(
                "previous_questions",
                [],
            ),
            previous_performance=state.get(
                "previous_performance",
                [],
            ),
            resume_source_id=state.get(
                "resume_source_id",
            ),
            job_description_source_id=state.get(
                "job_description_source_id",
            ),
        )

        questions = [
            question.model_dump()
            if hasattr(question, "model_dump")
            else question
            for question in result.questions
        ]

        return {
            "questions": questions,
            "total_questions": len(questions),
            "question_number": 1 if questions else 0,
            "previous_questions": [
                question.get("question", "")
                for question in questions
                if isinstance(question, dict)
            ],
            "error": None,
        }

    except Exception as error:
        print(
            "LangGraph next-question generation error:",
            error,
        )

        return {
            "questions": [],
            "total_questions": 0,
            "question_number": 0,
            "error": str(error),
        }


# ============================================================
# DIFFICULTY NODE
# ============================================================

def determine_difficulty(state: dict) -> dict:
    """
    Determine the target difficulty based on previous
    interview performance.

    Rules:

        Average >= 8
            → Hard

        Average >= 5 and < 8
            → Medium

        Average < 5
            → Easy
    """

    performance = state.get(
        "previous_performance",
        [],
    )

    if not performance:
        return {
            "current_difficulty": "medium",
        }

    scores = []

    for item in performance:
        if not isinstance(item, dict):
            continue

        score = item.get("score")

        if isinstance(score, (int, float)):
            scores.append(float(score))

    if not scores:
        return {
            "current_difficulty": "medium",
        }

    average_score = (
        sum(scores) / len(scores)
    )

    if average_score >= 8:
        difficulty = "hard"

    elif average_score >= 5:
        difficulty = "medium"

    else:
        difficulty = "easy"

    return {
        "current_difficulty": difficulty,
    }


# ============================================================
# STATE VALIDATION NODE
# ============================================================

def validate_interview_state(state: dict) -> dict:
    """
    Validate the minimum information required for
    an interview workflow.
    """

    required_fields = [
        "resume_text",
        "interview_type",
    ]

    missing_fields = [
        field
        for field in required_fields
        if not state.get(field)
    ]

    if missing_fields:
        error_message = (
            "Missing required interview fields: "
            + ", ".join(missing_fields)
        )

        print(
            "LangGraph state validation error:",
            error_message,
        )

        return {
            "error": error_message,
        }

    return {
        "error": None,
    }