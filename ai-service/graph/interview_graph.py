from langgraph.graph import StateGraph, START, END

from .state import InterviewState

from .nodes import (
    validate_interview_state,
    retrieve_interview_context,
    generate_questions_node,
    evaluate_answer_node,
    determine_difficulty,
    generate_next_questions_node,
)


# ============================================================
# START INTERVIEW GRAPH
# ============================================================

def build_start_interview_graph():
    """
    Build and compile the workflow used when starting
    a new interview.

    Flow:

        START
          ↓
        Validate
          ↓
        Retrieve RAG Context
          ↓
        Generate Questions
          ↓
        END
    """

    graph = StateGraph(InterviewState)

    # --------------------------------------------------------
    # Nodes
    # --------------------------------------------------------

    graph.add_node(
        "validate",
        validate_interview_state,
    )

    graph.add_node(
        "retrieve_context",
        retrieve_interview_context,
    )

    graph.add_node(
        "generate_questions",
        generate_questions_node,
    )

    # --------------------------------------------------------
    # Edges
    # --------------------------------------------------------

    graph.add_edge(
        START,
        "validate",
    )

    graph.add_edge(
        "validate",
        "retrieve_context",
    )

    graph.add_edge(
        "retrieve_context",
        "generate_questions",
    )

    graph.add_edge(
        "generate_questions",
        END,
    )

    return graph.compile()


# ============================================================
# ANSWER EVALUATION GRAPH
# ============================================================

def build_answer_evaluation_graph():
    """
    Build and compile the workflow used after the candidate
    submits an answer.

    Flow:

        START
          ↓
        Validate
          ↓
        Retrieve RAG Context
          ↓
        Evaluate Answer
          ↓
        Determine Difficulty
          ↓
        END
    """

    graph = StateGraph(InterviewState)

    # --------------------------------------------------------
    # Nodes
    # --------------------------------------------------------

    graph.add_node(
        "validate",
        validate_interview_state,
    )

    graph.add_node(
        "retrieve_context",
        retrieve_interview_context,
    )

    graph.add_node(
        "evaluate_answer",
        evaluate_answer_node,
    )

    graph.add_node(
        "determine_difficulty",
        determine_difficulty,
    )

    # --------------------------------------------------------
    # Edges
    # --------------------------------------------------------

    graph.add_edge(
        START,
        "validate",
    )

    graph.add_edge(
        "validate",
        "retrieve_context",
    )

    graph.add_edge(
        "retrieve_context",
        "evaluate_answer",
    )

    graph.add_edge(
        "evaluate_answer",
        "determine_difficulty",
    )

    graph.add_edge(
        "determine_difficulty",
        END,
    )

    return graph.compile()


# ============================================================
# NEXT INTERVIEW BATCH GRAPH
# ============================================================

def build_next_batch_graph():
    """
    Build and compile the workflow used when generating
    the next batch of interview questions.

    Flow:

        START
          ↓
        Validate
          ↓
        Retrieve RAG Context
          ↓
        Determine Difficulty
          ↓
        Generate Next Questions
          ↓
        END
    """

    graph = StateGraph(InterviewState)

    # --------------------------------------------------------
    # Nodes
    # --------------------------------------------------------

    graph.add_node(
        "validate",
        validate_interview_state,
    )

    graph.add_node(
        "retrieve_context",
        retrieve_interview_context,
    )

    graph.add_node(
        "determine_difficulty",
        determine_difficulty,
    )

    graph.add_node(
        "generate_next_questions",
        generate_next_questions_node,
    )

    # --------------------------------------------------------
    # Edges
    # --------------------------------------------------------

    graph.add_edge(
        START,
        "validate",
    )

    graph.add_edge(
        "validate",
        "retrieve_context",
    )

    graph.add_edge(
        "retrieve_context",
        "determine_difficulty",
    )

    graph.add_edge(
        "determine_difficulty",
        "generate_next_questions",
    )

    graph.add_edge(
        "generate_next_questions",
        END,
    )

    return graph.compile()


# ============================================================
# COMPILE ALL GRAPHS
# ============================================================

start_interview_graph = build_start_interview_graph()

answer_evaluation_graph = build_answer_evaluation_graph()

next_batch_graph = build_next_batch_graph()


# ============================================================
# HELPER — BASE INTERVIEW STATE
# ============================================================

def create_base_interview_state(
    resume_text: str,
    job_description: str,
    interview_type: str,
    previous_questions: list[str] | None = None,
    previous_performance: list[dict] | None = None,
    resume_source_id: str | None = None,
    job_description_source_id: str | None = None,
):
    """
    Create the common state structure shared by all
    interview workflows.
    """

    return {
        "resume_text": resume_text,
        "job_description": job_description,
        "interview_type": interview_type,

        "resume_source_id": resume_source_id,
        "job_description_source_id": job_description_source_id,

        "resume_context": "",
        "job_description_context": "",
        "rag_context": "",

        "current_question": "",
        "current_difficulty": "medium",

        "questions": [],

        "previous_questions": (
            previous_questions or []
        ),

        "answer": "",

        "score": 0,

        "answer_match": False,

        "correct_answer": "",

        "previous_performance": (
            previous_performance or []
        ),

        "question_number": 0,

        "total_questions": 0,

        "evaluation": {},

        "error": None,
    }


# ============================================================
# RUN — START INTERVIEW
# ============================================================

def run_interview_start(
    resume_text: str,
    job_description: str,
    interview_type: str,
    resume_source_id: str | None = None,
    job_description_source_id: str | None = None,
):
    """
    Run the complete LangGraph workflow for starting
    a new interview.
    """

    initial_state = create_base_interview_state(
        resume_text=resume_text,
        job_description=job_description,
        interview_type=interview_type,
        previous_questions=[],
        previous_performance=[],
        resume_source_id=resume_source_id,
        job_description_source_id=job_description_source_id,
    )

    return start_interview_graph.invoke(
        initial_state
    )


# ============================================================
# RUN — ANSWER EVALUATION
# ============================================================

def run_answer_evaluation(
    resume_text: str,
    job_description: str,
    interview_type: str,
    question: str,
    answer: str,
    previous_questions: list[str] | None = None,
    previous_performance: list[dict] | None = None,
    resume_source_id: str | None = None,
    job_description_source_id: str | None = None,
):
    """
    Run the complete LangGraph workflow for evaluating
    a candidate's answer.

    Flow:

        Validate
            ↓
        RAG Retrieval
            ↓
        Answer Evaluation
            ↓
        Difficulty Analysis
            ↓
        END
    """

    initial_state = create_base_interview_state(
        resume_text=resume_text,
        job_description=job_description,
        interview_type=interview_type,
        previous_questions=previous_questions,
        previous_performance=previous_performance,
        resume_source_id=resume_source_id,
        job_description_source_id=job_description_source_id,
    )

    # Set the current question and candidate answer.
    initial_state["current_question"] = question
    initial_state["answer"] = answer

    return answer_evaluation_graph.invoke(
        initial_state
    )


# ============================================================
# RUN — NEXT INTERVIEW BATCH
# ============================================================

def run_next_interview_batch(
    resume_text: str,
    job_description: str,
    interview_type: str,
    previous_questions: list[str] | None = None,
    previous_performance: list[dict] | None = None,
    resume_source_id: str | None = None,
    job_description_source_id: str | None = None,
):
    """
    Run the complete LangGraph workflow for generating
    the next batch of interview questions.

    Flow:

        Validate
            ↓
        RAG Retrieval
            ↓
        Determine Difficulty
            ↓
        Generate Next Questions
            ↓
        END
    """

    initial_state = create_base_interview_state(
        resume_text=resume_text,
        job_description=job_description,
        interview_type=interview_type,
        previous_questions=previous_questions,
        previous_performance=previous_performance,
        resume_source_id=resume_source_id,
        job_description_source_id=job_description_source_id,
    )

    return next_batch_graph.invoke(
        initial_state
    )