from typing import List, Literal
from pydantic import BaseModel, Field


class SkillMatch(BaseModel):
    skill: str

    status: str = Field(
        description="One of: matched, missing, partial"
    )

    evidence: str


class ResumeAnalysis(BaseModel):
    ats_score: int = Field(
        ge=0,
        le=100,
        description="Estimated ATS compatibility score from 0 to 100"
    )

    summary: str

    matched_skills: List[str]

    missing_skills: List[str]

    partial_skills: List[str]

    keyword_matches: List[str]

    important_keywords_missing: List[str]

    skill_analysis: List[SkillMatch]

    resume_strengths: List[str]

    resume_gaps: List[str]

    recommendations: List[str]


# ======================================================
# RESUME OPTIMIZATION
# ======================================================

class ResumeSuggestion(BaseModel):
    section: str = Field(
        description=(
            "Resume section such as Summary, Skills, "
            "Experience, or Projects"
        )
    )

    original: str = Field(
        description=(
            "The exact existing resume text that should be improved"
        )
    )

    replacement: str = Field(
        description=(
            "Improved replacement text based only on facts "
            "already present in the resume"
        )
    )

    reason: str = Field(
        description=(
            "Why this change improves relevance, clarity, "
            "or ATS compatibility"
        )
    )


class ResumeOptimization(BaseModel):
    suggestions: List[ResumeSuggestion] = Field(
        description=(
            "Only meaningful resume changes that should "
            "actually be considered"
        )
    )

    keywords_to_add: List[str] = Field(
        description=(
            "JD keywords that can truthfully be added "
            "because the resume supports them"
        )
    )

    keywords_not_supported: List[str] = Field(
        description=(
            "Important JD keywords that should not be added "
            "because the resume does not provide evidence"
        )
    )

    ats_improvements: List[str] = Field(
        description=(
            "Only important ATS improvements that are "
            "relevant to this resume"
        )
    )


# ======================================================
# AI INTERVIEW
# ======================================================

class InterviewQuestion(BaseModel):
    question: str = Field(
        description="The interview question to ask the candidate"
    )

    question_type: Literal[
        "technical",
        "behavioral",
        "project",
        "general",
    ] = Field(
        description=(
            "Type of interview question"
        )
    )

    difficulty: Literal[
        "easy",
        "medium",
        "hard",
    ] = Field(
        description=(
            "Difficulty level of the interview question"
        )
    )


class InterviewEvaluation(BaseModel):
    score: int = Field(
        ge=0,
        le=10,
        description=(
            "Overall answer quality score from 0 to 10"
        )
    )

    answer_match_percentage: int = Field(
        ge=0,
        le=100,
        description=(
            "Conceptual correctness percentage from 0 to 100. "
            "This measures how well the candidate's answer "
            "matches the key concepts expected in the correct "
            "answer, not literal text similarity."
        )
    )

    correct_answer: str = Field(
        description=(
            "A clear, technically correct model answer to the "
            "interview question. The answer should be appropriate "
            "for the candidate's level and should not contain "
            "information that is unsupported when the question "
            "depends on the candidate's resume."
        )
    )

    feedback: str = Field(
        description=(
            "Concise feedback explaining how accurately and "
            "effectively the candidate answered the question."
        )
    )

    strengths: List[str] = Field(
        description=(
            "Specific things the candidate did well in the answer"
        )
    )

    improvements: List[str] = Field(
        description=(
            "Specific things the candidate should improve "
            "in the answer"
        )
    )


class InterviewBatchResponse(BaseModel):
    questions: List[InterviewQuestion] = Field(
        min_length=10,
        max_length=10,
        description=(
            "Exactly 10 important interview questions "
            "for one interview round"
        )
    )


class InterviewStartResponse(BaseModel):
    questions: List[InterviewQuestion] = Field(
        min_length=10,
        max_length=10,
        description=(
            "Exactly 10 important interview questions "
            "for the first interview round"
        )
    )


class InterviewAnswerResponse(BaseModel):
    evaluation: InterviewEvaluation