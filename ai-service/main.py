from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File,
)

from pydantic import BaseModel, Field

from analyzer import analyze_resume
from optimizer import optimize_resume

from interviewer import (
    start_interview,
    generate_next_batch,
    evaluate_answer,
)

from rag_service import (
    index_document,
    retrieve_ai_context,
)


# ============================================================
# LANGGRAPH
# ============================================================

from graph.interview_graph import (
    run_interview_start,
    run_answer_evaluation,
    run_next_interview_batch,
)


# ============================================================
# GEMINI
# ============================================================

import os

from dotenv import load_dotenv
from google import genai


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY is not configured"
    )


gemini_client = genai.Client(
    api_key=GEMINI_API_KEY
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Crackd.ai AI Service",
    version="1.0.0",
)


# ============================================================
# REQUEST MODELS
# ============================================================


class AnalysisRequest(BaseModel):
    resume_text: str = Field(min_length=1)
    job_description: str = Field(min_length=1)


class InterviewStartRequest(BaseModel):
    resume_text: str = Field(min_length=1)

    job_description: str = ""

    interview_type: str = Field(
        min_length=1
    )

    resume_source_id: str | None = None

    job_description_source_id: str | None = None


class InterviewAnswerRequest(BaseModel):
    resume_text: str = Field(min_length=1)

    job_description: str = ""

    interview_type: str = Field(
        min_length=1
    )

    question: str = Field(min_length=1)

    answer: str = Field(min_length=1)

    previous_questions: list[str] = Field(
        default_factory=list
    )

    resume_source_id: str | None = None

    job_description_source_id: str | None = None


class InterviewNextBatchRequest(BaseModel):
    resume_text: str = Field(min_length=1)

    job_description: str = ""

    interview_type: str = Field(
        min_length=1
    )

    previous_questions: list[str] = Field(
        default_factory=list
    )

    previous_performance: list[dict] = Field(
        default_factory=list
    )

    resume_source_id: str | None = None

    job_description_source_id: str | None = None


# ============================================================
# LANGGRAPH REQUEST MODELS
# ============================================================


class GraphInterviewStartRequest(BaseModel):
    resume_text: str = Field(min_length=1)

    job_description: str = ""

    interview_type: str = Field(
        min_length=1
    )

    resume_source_id: str | None = None

    job_description_source_id: str | None = None


class GraphInterviewAnswerRequest(BaseModel):
    resume_text: str = Field(min_length=1)

    job_description: str = ""

    interview_type: str = Field(
        min_length=1
    )

    question: str = Field(min_length=1)

    answer: str = Field(min_length=1)

    previous_questions: list[str] = Field(
        default_factory=list
    )

    previous_performance: list[dict] = Field(
        default_factory=list
    )

    resume_source_id: str | None = None

    job_description_source_id: str | None = None


class GraphInterviewNextBatchRequest(BaseModel):
    resume_text: str = Field(min_length=1)

    job_description: str = ""

    interview_type: str = Field(
        min_length=1
    )

    previous_questions: list[str] = Field(
        default_factory=list
    )

    previous_performance: list[dict] = Field(
        default_factory=list
    )

    resume_source_id: str | None = None

    job_description_source_id: str | None = None


# ============================================================
# RAG REQUEST MODELS
# ============================================================


class RagIndexRequest(BaseModel):
    source_id: str = Field(min_length=1)

    source_type: str = Field(min_length=1)

    text: str = Field(min_length=1)


class RagSearchRequest(BaseModel):
    query: str = Field(min_length=1)

    n_results: int = Field(
        default=5,
        ge=1,
        le=20,
    )

    source_id: str | None = None

    source_type: str | None = None


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return {
        "success": True,
        "message": "Crackd.ai AI service is healthy 🚀",
    }


# ============================================================
# RESUME ANALYSIS
# ============================================================

@app.post("/analyze")
def analyze(
    request: AnalysisRequest
):
    try:

        result = analyze_resume(
            request.resume_text,
            request.job_description,
        )

        return {
            "success": True,
            "analysis": result.model_dump(),
        }

    except Exception as error:

        print(
            "AI analysis error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="AI analysis failed",
        )


# ============================================================
# RESUME OPTIMIZATION
# ============================================================

@app.post("/optimize")
def optimize(
    request: AnalysisRequest
):
    try:

        result = optimize_resume(
            request.resume_text,
            request.job_description,
        )

        return {
            "success": True,
            "optimization": result.model_dump(),
        }

    except Exception as error:

        print(
            "AI resume optimization error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="AI resume optimization failed",
        )


# ============================================================
# START FIRST INTERVIEW ROUND
# ============================================================

@app.post("/interview/start")
def interview_start(
    request: InterviewStartRequest
):
    try:

        result = start_interview(
            resume_text=request.resume_text,
            job_description=request.job_description,
            interview_type=request.interview_type,
            resume_source_id=request.resume_source_id,
            job_description_source_id=request.job_description_source_id,
        )

        return {
            "success": True,
            "questions": [
                question.model_dump()
                for question in result.questions
            ],
        }

    except Exception as error:

        print(
            "Interview start error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Interview start failed",
        )


# ============================================================
# EVALUATE CURRENT INTERVIEW ANSWER
# ============================================================

@app.post("/interview/answer")
def interview_answer(
    request: InterviewAnswerRequest
):
    try:

        result = evaluate_answer(
            resume_text=request.resume_text,
            job_description=request.job_description,
            interview_type=request.interview_type,
            question=request.question,
            answer=request.answer,
            previous_questions=request.previous_questions,
            resume_source_id=request.resume_source_id,
            job_description_source_id=request.job_description_source_id,
        )

        return {
            "success": True,
            "evaluation": result.evaluation.model_dump(),
        }

    except Exception as error:

        print(
            "Interview answer error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Interview answer evaluation failed",
        )


# ============================================================
# GENERATE NEXT 10 QUESTIONS
# WITH ADAPTIVE DIFFICULTY
# ============================================================

@app.post("/interview/next-batch")
def interview_next_batch(
    request: InterviewNextBatchRequest
):
    try:

        result = generate_next_batch(
            resume_text=request.resume_text,
            job_description=request.job_description,
            interview_type=request.interview_type,
            previous_questions=request.previous_questions,
            previous_performance=request.previous_performance,
            resume_source_id=request.resume_source_id,
            job_description_source_id=request.job_description_source_id,
        )

        return {
            "success": True,
            "questions": [
                question.model_dump()
                for question in result.questions
            ],
        }

    except Exception as error:

        print(
            "Next interview batch error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Next interview batch generation failed",
        )


# ============================================================
# LANGGRAPH - START INTERVIEW
# ============================================================

@app.post("/interview/graph/start")
def graph_interview_start(
    request: GraphInterviewStartRequest
):
    """
    Start an interview using the LangGraph workflow.

    Workflow:

        Validate
            ↓
        RAG Retrieval
            ↓
        Question Generation
    """

    try:

        result = run_interview_start(
            resume_text=request.resume_text,
            job_description=request.job_description,
            interview_type=request.interview_type,
            resume_source_id=request.resume_source_id,
            job_description_source_id=request.job_description_source_id,
        )

        if result.get("error"):
            raise HTTPException(
                status_code=500,
                detail=result["error"],
            )

        return {
            "success": True,

            "questions": result.get(
                "questions",
                [],
            ),

            "rag_context": result.get(
                "rag_context",
                "",
            ),

            "resume_context": result.get(
                "resume_context",
                "",
            ),

            "job_description_context": result.get(
                "job_description_context",
                "",
            ),

            "total_questions": result.get(
                "total_questions",
                0,
            ),
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "LangGraph interview start error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="LangGraph interview start failed",
        )


# ============================================================
# LANGGRAPH - EVALUATE ANSWER
# ============================================================

@app.post("/interview/graph/answer")
def graph_interview_answer(
    request: GraphInterviewAnswerRequest
):
    """
    Evaluate an interview answer using the LangGraph
    evaluation workflow.
    """

    try:

        result = run_answer_evaluation(
            resume_text=request.resume_text,
            job_description=request.job_description,
            interview_type=request.interview_type,
            question=request.question,
            answer=request.answer,
            previous_questions=request.previous_questions,
            previous_performance=request.previous_performance,
            resume_source_id=request.resume_source_id,
            job_description_source_id=request.job_description_source_id,
        )

        if result.get("error"):
            raise HTTPException(
                status_code=500,
                detail=result["error"],
            )

        return {
            "success": True,

            "evaluation": result.get(
                "evaluation",
                {},
            ),

            "score": result.get(
                "score",
                0,
            ),

            "answer_match": result.get(
                "answer_match",
                False,
            ),

            "correct_answer": result.get(
                "correct_answer",
                "",
            ),

            "current_difficulty": result.get(
                "current_difficulty",
                "medium",
            ),
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "LangGraph answer evaluation error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="LangGraph answer evaluation failed",
        )


# ============================================================
# LANGGRAPH - NEXT QUESTION BATCH
# ============================================================

@app.post("/interview/graph/next-batch")
def graph_interview_next_batch(
    request: GraphInterviewNextBatchRequest
):
    """
    Generate the next interview batch using LangGraph.

    Previous performance is used to determine adaptive
    difficulty before generating the next questions.
    """

    try:

        result = run_next_interview_batch(
            resume_text=request.resume_text,
            job_description=request.job_description,
            interview_type=request.interview_type,
            previous_questions=request.previous_questions,
            previous_performance=request.previous_performance,
            resume_source_id=request.resume_source_id,
            job_description_source_id=request.job_description_source_id,
        )

        if result.get("error"):
            raise HTTPException(
                status_code=500,
                detail=result["error"],
            )

        return {
            "success": True,

            "questions": result.get(
                "questions",
                [],
            ),

            "current_difficulty": result.get(
                "current_difficulty",
                "medium",
            ),

            "total_questions": result.get(
                "total_questions",
                0,
            ),
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "LangGraph next batch error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="LangGraph next batch generation failed",
        )


# ============================================================
# AUDIO -> TEXT
# ============================================================

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...)
):
    try:

        # ----------------------------------------------------
        # VALIDATE FILE
        # ----------------------------------------------------

        if not file:
            raise HTTPException(
                status_code=400,
                detail="Audio file is required",
            )

        audio_bytes = await file.read()

        if not audio_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded audio is empty",
            )

        print(
            f"Transcribing audio: "
            f"{file.filename} "
            f"({file.content_type})"
        )

        # ----------------------------------------------------
        # GEMINI TRANSCRIPTION
        # ----------------------------------------------------

        audio_part = genai.types.Part.from_bytes(
            data=audio_bytes,
            mime_type=file.content_type or "audio/webm",
        )

        response = gemini_client.models.generate_content(
            model="gemini-3.5-transcribe",
            contents=[
                "Generate an accurate transcript of the speech. "
                "Return only the spoken words as text. "
                "Do not summarize, explain, or add commentary.",
                audio_part,
            ],
        )

        # ----------------------------------------------------
        # EXTRACT TRANSCRIBED TEXT
        # ----------------------------------------------------

        text = getattr(
            response,
            "text",
            None,
        )

        if text is None:
            text = ""

        text = text.strip()

        # ----------------------------------------------------
        # NO SPEECH DETECTED
        # ----------------------------------------------------

        if not text:
            return {
                "success": True,
                "text": "",
                "message": "No speech detected.",
            }

        # ----------------------------------------------------
        # SUCCESS
        # ----------------------------------------------------

        return {
            "success": True,
            "text": text,
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "Audio transcription error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Audio transcription failed",
        )


# ============================================================
# RAG - INDEX DOCUMENT
# ============================================================

@app.post("/rag/index")
def rag_index(
    request: RagIndexRequest
):
    try:

        result = index_document(
            source_id=request.source_id,
            source_type=request.source_type,
            text=request.text,
        )

        return result

    except ValueError as error:

        print(
            "RAG indexing validation error:",
            error
        )

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        print(
            "RAG indexing error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="RAG document indexing failed",
        )


# ============================================================
# RAG - SEARCH / RETRIEVE
# ============================================================

@app.post("/rag/search")
def rag_search(
    request: RagSearchRequest
):
    try:

        result = retrieve_ai_context(
            query=request.query,
            n_results=request.n_results,
            source_id=request.source_id,
            source_type=request.source_type,
        )

        return {
            "success": True,
            **result,
        }

    except ValueError as error:

        print(
            "RAG search validation error:",
            error
        )

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        print(
            "RAG search error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="RAG search failed",
        )