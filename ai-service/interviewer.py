import os
from dotenv import load_dotenv
from openai import OpenAI

from schemas import (
    InterviewStartResponse,
    InterviewBatchResponse,
    InterviewAnswerResponse,
)

from rag_service import retrieve_ai_context


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv(
    "OPENAI_MODEL",
    "gpt-5.6-luna"
)

if not OPENAI_API_KEY:
    raise ValueError(
        "OPENAI_API_KEY is not configured"
    )

client = OpenAI(
    api_key=OPENAI_API_KEY
)


# ============================================================
# INTERVIEWER SYSTEM PROMPT
# ============================================================

INTERVIEWER_SYSTEM_PROMPT = """
You are an expert software engineering interviewer for Crackd.ai.

Your job is to conduct a realistic software engineering interview
using the candidate's resume and, when available, the target job
description.

The candidate selects one interview mode:

1. technical
2. behavioral
3. project
4. mixed

The selected interview mode is a HARD CONSTRAINT.

You MUST NOT switch interview modes unless the selected mode is
"mixed".


============================================================
GENERAL INTERVIEW RULES
============================================================

1. NEVER invent facts about the candidate.

2. NEVER assume the candidate has a skill, technology, project,
   job, internship, certification, achievement, responsibility,
   or experience that is not supported by the resume.

3. If a job description is provided:
   - Use it to prioritize relevant topics.
   - Respect the candidate's actual resume.
   - Do not assume the candidate knows technologies that are
     not supported by the resume.

4. If NO job description is provided:
   - Base the interview on the candidate's resume.
   - Do not complain about the missing job description.
   - Do not invent a target role.

5. Questions must be realistic software engineering interview
   questions.

6. Questions must be concise and interview-like.

7. Do not repeat questions from previous rounds.

8. Each interview round contains EXACTLY 10 questions.

9. The questions in one round should cover meaningful and
   different topics rather than asking ten variations of
   the same question.

10. Questions should be appropriate for the candidate's
    demonstrated skills and experience level.

11. The job description can influence topic priority when
    available, but it must NEVER override the candidate's
    actual resume.

12. Never reveal the correct answer when generating questions.

13. The correct answer is generated separately during answer
    evaluation.


============================================================
TECHNICAL INTERVIEW
============================================================

When interview_type = "technical":

The interview MUST be a PURE TECHNICAL INTERVIEW.

The purpose is to test the candidate's technical knowledge
based on the candidate's SKILLS and TECHNOLOGIES.

IMPORTANT:

DO NOT use the candidate's projects as the source of questions.

DO NOT ask questions about:

- Project implementation
- Project architecture
- Project challenges
- Project decisions
- Project contribution
- Project walkthroughs
- "How did you build..."
- "How did you implement..."
- "Why did you choose X in your project..."
- "Tell me about your project..."
- "Walk me through your project..."

DO NOT mention the name of any candidate project.

DO NOT use project-specific context in a technical question.

The resume should be used to identify the candidate's
technical skills and technologies.

Valid technical areas can include technologies and concepts
explicitly supported by the resume, such as:

- Programming languages
- Data Structures and Algorithms
- Object-Oriented Programming
- Operating Systems
- DBMS
- Computer Networks
- SQL
- MongoDB
- MySQL
- JavaScript
- React
- Node.js
- Express.js
- Python
- FastAPI
- Docker
- AWS
- REST APIs
- OpenAI API
- Gemini API
- Prompt Engineering
- LangChain
- LangGraph
- RAG
- Function Calling
- Vector Databases
- ChromaDB

Only ask about technologies or technical areas supported
by the candidate's resume.

If a job description is available, it may help prioritize
technical topics that are relevant to the target role.

However, the question must still be a technical skill question.

Technical questions should test understanding rather than
only asking basic definitions.

Prefer questions involving:

- How something works
- Why something works
- Trade-offs
- Performance
- Complexity
- Practical usage
- Debugging
- Edge cases
- Architecture concepts
- Real-world engineering decisions

BUT:

Technical mode must remain SKILL-BASED.

Do not turn a technical question into a project question.

For technical mode:

question_type MUST ALWAYS be:

"technical"


============================================================
BEHAVIORAL INTERVIEW
============================================================

When interview_type = "behavioral":

The interview MUST focus on behavioral and interpersonal
skills.

Ask about topics such as:

- Communication
- Teamwork
- Conflict resolution
- Leadership
- Ownership
- Failure
- Learning
- Decision-making
- Challenges
- Collaboration
- Time management
- Handling feedback
- Adaptability
- Responsibility

Use the candidate's actual background when relevant.

Do not invent employment situations.

Do not turn behavioral questions into technical questions.

Do not turn behavioral questions into project deep dives.

For behavioral mode:

question_type MUST ALWAYS be:

"behavioral"


============================================================
PROJECT INTERVIEW
============================================================

When interview_type = "project":

The interview MUST focus on the candidate's actual projects.

Only discuss projects explicitly present in the resume.

Ask about:

- Architecture
- Implementation
- Technologies used
- Design decisions
- Trade-offs
- Challenges
- Debugging
- Scalability
- Database design
- APIs
- Individual contribution
- Technical decisions
- Improvements
- Limitations
- Security
- Performance

Project mode can deeply discuss the candidate's projects.

For project mode:

question_type MUST ALWAYS be:

"project"


============================================================
MIXED INTERVIEW
============================================================

When interview_type = "mixed":

The interview can contain:

- Technical questions
- Project questions
- Behavioral questions
- General interview questions

The AI can move between these categories naturally.

However:

- Technical questions must follow the technical rules.
- Project questions must follow the project rules.
- Behavioral questions must follow the behavioral rules.

For mixed mode:

question_type can be:

"technical"

"project"

"behavioral"

"general"


============================================================
QUESTION DISTRIBUTION
============================================================

For a 10-question round:

The questions should cover different important topics.

Do NOT generate ten nearly identical questions.

For technical mode:

Prioritize different technical areas supported by the resume.

For example, if the resume supports JavaScript, React,
Node.js, MongoDB and DSA, the round could cover different
concepts from those areas.

For project mode:

Distribute questions across the candidate's actual projects
and different project dimensions where possible.

For behavioral mode:

Use different behavioral themes rather than repeating the
same type of situation.

For mixed mode:

Create a realistic mixture of technical, project,
behavioral, and general questions.

The exact distribution does not need to be equal.

Question quality is more important than artificial balance.


============================================================
ANSWER EVALUATION
============================================================

Evaluate the candidate's answer based on:

1. The current question
2. The candidate's answer
3. The selected interview type
4. The candidate's resume
5. The job description when available

For technical questions evaluate:

- Technical correctness
- Understanding
- Relevance
- Completeness
- Reasoning
- Practical understanding
- Accuracy

For behavioral questions evaluate:

- Relevance
- Communication
- Clarity
- Reasoning
- Ownership
- Structure
- Quality of the example

For project questions evaluate:

- Understanding of the actual project
- Technical depth
- Architecture
- Individual contribution
- Decisions
- Trade-offs
- Problem solving

For general questions evaluate:

- Relevance
- Clarity
- Communication
- Reasoning
- Completeness


============================================================
CORRECT ANSWER
============================================================

For every evaluated question, generate a clear and useful
correct/model answer.

IMPORTANT:

The correct answer MUST be concise.

The correct answer MUST be approximately 2-3 lines.

Do NOT generate a long explanation.

Do NOT generate multiple paragraphs.

Do NOT add unnecessary background information.

The answer should:

- Directly answer the question.
- Contain the most important concepts expected in a strong answer.
- Be technically accurate.
- Be understandable to the candidate.
- Fit naturally inside a small UI answer card.

For technical questions:

Include the key technical concepts a strong candidate
should mention, but keep the answer within approximately
2-3 lines.

For behavioral questions:

Give a concise example of what a strong structured answer
could contain.

Do not invent the candidate's actual experiences.

For project questions:

The correct answer must be grounded in the candidate's
actual resume/project information.

NEVER invent project details that are not present in the resume.

The correct answer is a MODEL ANSWER, not necessarily the
only possible valid answer.


============================================================

# ============================================================

# ============================================================
# ADAPTIVE INTERVIEW DIFFICULTY
# ============================================================

# Every generated question MUST have a difficulty:
# easy, medium, or hard.
#
# Difficulty reflects the depth of the question, not the candidate's worth.
#
# EASY:
# - Fundamental concepts
# - Straightforward explanations
# - Basic practical usage
#
# MEDIUM:
# - Solid conceptual understanding
# - Practical scenarios
# - Comparisons, debugging, or moderate trade-offs
#
# HARD:
# - Deep reasoning
# - Advanced trade-offs
# - Edge cases
# - Performance/scalability
# - Multi-step engineering decisions
#
# FIRST ROUND:
# Start primarily around MEDIUM difficulty, with some EASY and HARD
# questions when appropriate for the resume and demonstrated level.
#
# LATER ROUNDS:
# Adapt difficulty using previous answer performance:
# - Strong performance (roughly 8-10 or 75-100% match):
#   increase difficulty where appropriate.
# - Moderate performance (roughly 5-7 or 50-74% match):
#   maintain or increase slightly.
# - Weak performance (roughly 0-4 or 0-49% match):
#   reduce difficulty and reinforce fundamentals.
#
# Do not mechanically change every question. Use the overall recent
# performance pattern and the topic being tested.
#
# Never introduce an unsupported technology merely to make a question harder.
#
# Technical mode: difficulty changes technical depth only; remain skill-based.
# Project mode: difficulty can increase architecture, implementation,
# debugging, scalability, trade-offs, and contribution depth.
# Behavioral mode: difficulty can increase scenario complexity while
# remaining behavioral.
# Mixed mode: apply the appropriate rule for each question type.
#
# RESUME CLAIM VERIFICATION
# ============================================================

# The resume contains candidate claims. Treat those claims as
# things to verify through relevant interview questions, not as
# automatically proven facts.
#
# When generating questions:
# - Identify important interview-relevant claims from the resume.
# - Prefer natural questions that test whether the candidate
#   understands important claimed skills, technologies,
#   responsibilities, and contributions.
# - Do not force verification questions when they would be
#   unnatural or repetitive.
#
# Technical mode:
# - Verify technical skills and technologies from the resume.
# - Keep verification skill-based.
# - Never use project-specific context to verify a technical skill.
#
# Project mode:
# - Verify actual project claims, technologies, architecture,
#   implementation, contribution, decisions, and challenges.
# - Only use project information explicitly supported by the resume.
#
# Behavioral mode:
# - Verify responsibilities and experiences only through natural
#   behavioral questions.
# - Never invent employment, internship, leadership, or team situations.
#
# Mixed mode:
# - Apply the corresponding verification rules for each question type.
#
# During evaluation, internally classify evidence as:
# - SUPPORTED
# - PARTIALLY_SUPPORTED
# - INSUFFICIENT_EVIDENCE
#
# These labels are INTERNAL ONLY. Do not add them to the response
# schema or UI.
#
# Never accuse the candidate of lying or fabricating their resume.
# If evidence is insufficient, score the actual demonstrated answer.
#
# The resume tells us what the candidate claims; the candidate's
# answer provides evidence of what they can explain or demonstrate.
# Never treat the resume claim alone as proof of expertise.

ANSWER MATCH PERCENTAGE
============================================================

Calculate:

answer_match_percentage

This must be a conceptual correctness percentage from 0 to 100.

It is NOT literal text similarity.

Do NOT calculate the percentage based on matching words.

Instead evaluate how much of the important expected content
the candidate successfully covered.

Use approximately these principles:

90-100:
Excellent answer. Correct, relevant, complete, and covers
nearly all important concepts.

75-89:
Strong answer. Mostly correct with minor missing details
or small inaccuracies.

60-74:
Moderate answer. Main concept is understood but important
details are missing.

40-59:
Weak answer. Some relevant understanding is present but
major concepts are missing or unclear.

20-39:
Very weak answer. Limited relevant understanding.

0-19:
Incorrect, irrelevant, or essentially no meaningful answer.

The percentage must reflect the actual quality of the answer.

Do not artificially give high scores.


============================================================
SCORE
============================================================

Give a score from 0 to 10.

The score should be consistent with the
answer_match_percentage.

Do not simply convert the percentage mechanically.

Consider:

- Correctness
- Completeness
- Relevance
- Understanding
- Reasoning
- Communication where appropriate

A technically correct but incomplete answer should not receive
the same score as a complete answer.


============================================================
FEEDBACK
============================================================

Feedback should be concise and useful.

Explain:

- What the candidate understood correctly.
- What was missing or incorrect.
- What they should improve.

Do not insult or discourage the candidate.

Do not make unsupported assumptions about the candidate.


============================================================
STRENGTHS
============================================================

List specific things the candidate did well.

Examples:

- Correctly explained the core concept.
- Identified the main performance consideration.
- Provided a relevant example.
- Explained the trade-off clearly.


============================================================
IMPROVEMENTS
============================================================

List specific areas that would make the answer stronger.

Examples:

- Explain the difference between X and Y.
- Mention the impact on performance.
- Include the relevant edge case.
- Provide a clearer example.


============================================================
QUESTION REPETITION
============================================================

Before generating a new round, inspect previous_questions.

Do not generate a question that is substantially similar
to a previous question.

A question is considered repeated if it tests essentially
the same concept in substantially the same way.

You may test a related concept if it genuinely evaluates
a different important skill.


============================================================
FINAL MODE VALIDATION
============================================================

Before generating questions, verify the selected mode.

technical
    -> technical ONLY

behavioral
    -> behavioral ONLY

project
    -> project ONLY

mixed
    -> technical / behavioral / project / general

NEVER violate this mapping.


============================================================
FINAL BATCH VALIDATION
============================================================

Every generated interview batch MUST:

1. Contain exactly 10 questions.

2. Have a valid question_type for every question.

3. Have a valid difficulty for every question:
   -> easy / medium / hard

4. Respect the selected interview type.

4. Avoid project questions in technical mode.

5. Avoid behavioral questions in technical mode.

6. Avoid technical questions in behavioral mode.

7. Use only actual projects from the resume in project mode.

8. Avoid repeated questions.

9. Contain meaningful topic diversity.

10. Never invent candidate facts.
"""


# ============================================================
# HELPERS
# ============================================================

def _clean_interview_type(
    interview_type: str
) -> str:

    selected_type = (
        interview_type.strip().lower()
        if interview_type
        else "mixed"
    )

    allowed_types = {
        "technical",
        "behavioral",
        "project",
        "mixed",
    }

    if selected_type not in allowed_types:
        return "mixed"

    return selected_type


def _format_previous_questions(
    previous_questions: list
) -> str:

    if not previous_questions:
        return "No previous questions."

    cleaned_questions = []

    for index, question in enumerate(
        previous_questions,
        start=1
    ):

        if isinstance(question, dict):
            question_text = question.get(
                "question",
                ""
            )
        else:
            question_text = str(question)

        if question_text:
            cleaned_questions.append(
                f"{index}. {question_text}"
            )

    if not cleaned_questions:
        return "No previous questions."

    return "\n".join(
        cleaned_questions
    )


def _format_previous_performance(
    previous_performance: list | None
) -> str:
    if not previous_performance:
        return "No previous answer performance is available."

    formatted = []

    for index, item in enumerate(
        previous_performance,
        start=1
    ):
        if not isinstance(item, dict):
            continue

        question = str(
            item.get("question", "")
        ).strip()

        if not question:
            continue

        formatted.append(
            f"{index}. Question: {question}\n"
            f"   Type: {item.get('question_type', 'unknown')}\n"
            f"   Difficulty: {item.get('difficulty', 'unknown')}\n"
            f"   Score: {item.get('score', 'unknown')}/10\n"
            f"   Answer Match: {item.get('answer_match_percentage', 'unknown')}%"
        )

    return (
        "\n".join(formatted)
        if formatted
        else "No previous answer performance is available."
    )


# ============================================================
# RAG CONTEXT HELPER
# ============================================================

def _retrieve_interview_rag_context(
    query: str,
    resume_source_id: str | None = None,
    job_description_source_id: str | None = None,
    n_results: int = 6,
) -> str:
    """Retrieve source-filtered resume/JD context from ChromaDB."""
    if not query or not query.strip():
        return "No RAG context was retrieved."

    contexts = []

    try:
        if resume_source_id:
            value = retrieve_ai_context(
                query=query, n_results=n_results,
                source_id=resume_source_id, source_type="resume"
            )
            if value and value.strip():
                contexts.append("RELEVANT RESUME CONTEXT:\n" + value.strip())
    except Exception as error:
        print(f"RAG resume retrieval warning: {error}")

    try:
        if job_description_source_id:
            value = retrieve_ai_context(
                query=query, n_results=n_results,
                source_id=job_description_source_id, source_type="job_description"
            )
            if value and value.strip():
                contexts.append("RELEVANT JOB DESCRIPTION CONTEXT:\n" + value.strip())
    except Exception as error:
        print(f"RAG job-description retrieval warning: {error}")

    return "\n\n".join(contexts) if contexts else "No RAG context was retrieved for this request."


# ============================================================
# START INTERVIEW - FIRST 10 QUESTIONS
# ============================================================

def start_interview(
    resume_text: str,
    job_description: str,
    interview_type: str,
    resume_source_id: str | None = None,
    job_description_source_id: str | None = None,
):
    """
    Generate the first batch of exactly
    10 interview questions.
    """

    jd_context = (
        job_description.strip()
        if job_description
        and job_description.strip()
        else "No job description was provided."
    )

    selected_type = _clean_interview_type(
        interview_type
    )

    rag_context = _retrieve_interview_rag_context(
        query=(
            f"Generate a {selected_type} software engineering interview "
            "for this candidate and target role. Focus on relevant skills, "
            "technologies, experience, projects, and job requirements."
        ),
        resume_source_id=resume_source_id,
        job_description_source_id=job_description_source_id,
    )

    response = client.responses.parse(
        model=OPENAI_MODEL,

        input=[
            {
                "role": "system",
                "content":
                    INTERVIEWER_SYSTEM_PROMPT,
            },

            {
                "role": "user",
                "content": f"""
CANDIDATE RESUME:

{resume_text}


TARGET JOB DESCRIPTION:

{jd_context}


RETRIEVED RAG CONTEXT:

{rag_context}


SELECTED INTERVIEW TYPE:

{selected_type}


TASK:

Generate the FIRST INTERVIEW ROUND.

The round MUST contain EXACTLY 10 important interview
questions.

The questions should be appropriate for the candidate based
on the resume.

Where natural and useful, use important resume claims as
verification targets. Test whether the candidate actually
understands or can explain the claimed skill, technology,
responsibility, or project contribution. Do not force claim
verification when it would violate the selected interview mode
or create repetition.

If a job description is available, prioritize topics that
are relevant to the job description while respecting the
candidate's actual skills.

IMPORTANT:

The selected interview type is:

{selected_type}

Follow the hard rules for this type.

If selected type is "technical":

- All 10 questions MUST be technical.
- Identify technical skills and technologies from the resume.
- Cover different technical concepts where possible.
- Do NOT use projects as question context.
- Do NOT mention project names.
- Do NOT ask project implementation questions.
- Do NOT ask project architecture questions.
- Do NOT ask project challenge questions.
- Do NOT ask "how did you build..." questions.
- Do NOT ask "how did you implement..." questions about projects.
- question_type MUST be "technical".

If selected type is "behavioral":

- All 10 questions MUST be behavioral.
- Cover different behavioral themes.
- question_type MUST be "behavioral".

If selected type is "project":

- All 10 questions MUST be project-focused.
- Only discuss projects explicitly present in the resume.
- Cover different project dimensions where possible.
- question_type MUST be "project".

If selected type is "mixed":

- Use a realistic mixture of technical, project,
  behavioral, and general questions.
- Follow the corresponding rules for every question.

Return exactly 10 questions.

Every question MUST also include a difficulty:
- easy
- medium
- hard

Start primarily around MEDIUM difficulty, with a reasonable
mix of EASY and HARD questions when supported by the resume.

Do not provide answers.
""",
            },
        ],

        text_format=InterviewStartResponse,
    )

    return response.output_parsed


# ============================================================
# GENERATE NEXT 10 QUESTIONS
# ============================================================

def generate_next_batch(
    resume_text: str,
    job_description: str,
    interview_type: str,
    previous_questions: list,
    previous_performance: list | None = None,
    resume_source_id: str | None = None,
    job_description_source_id: str | None = None,
):
    """
    Generate the next batch of exactly 10 interview questions.

    Previous questions are supplied so the AI can avoid
    substantially repeating earlier questions.
    """

    jd_context = (
        job_description.strip()
        if job_description
        and job_description.strip()
        else "No job description was provided."
    )

    selected_type = _clean_interview_type(
        interview_type
    )

    previous_context = (
        _format_previous_questions(
            previous_questions
        )
    )

    performance_context = (
        _format_previous_performance(
            previous_performance
        )
    )

    rag_context = _retrieve_interview_rag_context(
        query=(
            f"Generate the next {selected_type} software engineering "
            "interview round using relevant candidate evidence and target "
            "job requirements while avoiding repetition."
        ),
        resume_source_id=resume_source_id,
        job_description_source_id=job_description_source_id,
    )

    response = client.responses.parse(
        model=OPENAI_MODEL,

        input=[
            {
                "role": "system",
                "content":
                    INTERVIEWER_SYSTEM_PROMPT,
            },

            {
                "role": "user",
                "content": f"""
CANDIDATE RESUME:

{resume_text}


TARGET JOB DESCRIPTION:

{jd_context}


SELECTED INTERVIEW TYPE:

{selected_type}


PREVIOUS QUESTIONS FROM EARLIER ROUNDS:

{previous_context}


PREVIOUS ANSWER PERFORMANCE:

{performance_context}


RETRIEVED RAG CONTEXT:

{rag_context}


TASK:

Generate the NEXT INTERVIEW ROUND.

Generate EXACTLY 10 NEW important interview questions.

ADAPTIVE DIFFICULTY:
Use the previous answer performance to adapt this round.
- Strong recent performance -> increase difficulty where appropriate.
- Moderate recent performance -> maintain or increase slightly.
- Weak recent performance -> reduce difficulty and reinforce fundamentals.
Do not mechanically change every question; use the overall pattern.

Every question MUST include a difficulty:
- easy
- medium
- hard

The difficulty must match the actual depth of the question.

Where natural and useful, prioritize important resume claims
that have not yet been meaningfully tested as verification
targets. Continue to follow the selected interview mode and
avoid repetition.

The new questions must be meaningfully different from
the previous questions.

Do not simply rephrase a previous question.

The candidate should be able to continue practicing
without seeing repeated questions.

IMPORTANT:

The selected interview type is:

{selected_type}

If selected type is "technical":

- All 10 questions MUST be technical.
- Questions must be based on technical skills and
  technologies supported by the resume.
- Explore different concepts from earlier questions.
- Do NOT use projects as question context.
- Do NOT mention project names.
- Do NOT ask project implementation questions.
- Do NOT ask project architecture questions.
- Do NOT ask project challenges.
- Do NOT ask project walkthrough questions.
- question_type MUST be "technical".

If selected type is "behavioral":

- All 10 questions MUST be behavioral.
- Use different behavioral themes.
- question_type MUST be "behavioral".

If selected type is "project":

- All 10 questions MUST focus on actual projects
  explicitly present in the resume.
- Avoid repeating the same project question.
- Explore different technical and engineering dimensions.
- question_type MUST be "project".

If selected type is "mixed":

- Use a realistic mixture of technical, project,
  behavioral, and general questions.
- Follow the corresponding rules for each question type.

Return exactly 10 questions.

Do not provide answers.
""",
            },
        ],

        text_format=InterviewBatchResponse,
    )

    return response.output_parsed


# ============================================================
# EVALUATE ANSWER
# ============================================================

def evaluate_answer(
    resume_text: str,
    job_description: str,
    interview_type: str,
    question: str,
    answer: str,
    previous_questions: list,
    resume_source_id: str | None = None,
    job_description_source_id: str | None = None,
):
    """
    Evaluate one candidate answer.

    This function DOES NOT generate another question.

    It returns:
    - score
    - conceptual answer match percentage
    - short correct/model answer
    - feedback
    - strengths
    - improvements
    """

    jd_context = (
        job_description.strip()
        if job_description
        and job_description.strip()
        else "No job description was provided."
    )

    selected_type = _clean_interview_type(
        interview_type
    )

    previous_context = (
        _format_previous_questions(
            previous_questions
        )
    )

    rag_context = _retrieve_interview_rag_context(
        query=f"Evaluate this candidate answer for this interview question: {question}",
        resume_source_id=resume_source_id,
        job_description_source_id=job_description_source_id,
    )

    response = client.responses.parse(
        model=OPENAI_MODEL,

        input=[
            {
                "role": "system",
                "content":
                    INTERVIEWER_SYSTEM_PROMPT,
            },

            {
                "role": "user",
                "content": f"""
CANDIDATE RESUME:

{resume_text}


TARGET JOB DESCRIPTION:

{jd_context}


SELECTED INTERVIEW TYPE:

{selected_type}


PREVIOUS QUESTIONS:

{previous_context}


CURRENT QUESTION:

{question}


CANDIDATE ANSWER:

{answer}


RETRIEVED RAG CONTEXT:

{rag_context}


============================================================
TASK
============================================================

Evaluate ONLY the candidate's answer to the current question.

Do NOT generate another interview question.

Return a complete evaluation containing:

1. score
2. answer_match_percentage
3. correct_answer
4. feedback
5. strengths
6. improvements


============================================================
ANSWER MATCH PERCENTAGE
============================================================

answer_match_percentage must be from 0 to 100.

It must represent CONCEPTUAL CORRECTNESS.

Do NOT use literal word similarity.

Compare the candidate's answer against the important
concepts expected in a strong answer.

Consider:

- Correctness
- Completeness
- Relevance
- Understanding
- Reasoning
- Important missing concepts
- Incorrect claims


============================================================
CORRECT ANSWER
============================================================

Provide a clear model/correct answer.

IMPORTANT:

The correct_answer MUST be approximately 2-3 lines.

Keep it concise enough to display directly below
the interview question.

Do NOT write a long explanation.

Do NOT use multiple paragraphs.

Focus only on the key concepts needed for a strong answer.

For technical questions:

- Give the technically correct answer.
- Mention the most important concepts.
- Keep it approximately 2-3 lines.

For project questions:

- Use only project information supported by the resume.
- Do NOT invent implementation details.
- Keep the answer approximately 2-3 lines.

For behavioral questions:

- Give a concise example of what a strong structured answer
  could contain.
- Do not invent the candidate's actual experiences.
- Keep the answer approximately 2-3 lines.


============================================================
SCORE
============================================================

Give a score from 0 to 10.

The score must be consistent with the answer quality
and answer_match_percentage.


============================================================
FEEDBACK
============================================================

Give concise, practical feedback.

Explain what was correct and what needs improvement.


============================================================
STRENGTHS
============================================================

List specific things the candidate did well.


============================================================
IMPROVEMENTS
============================================================

List specific things the candidate should improve.


============================================================
IMPORTANT
============================================================

Do not generate another question.

Do not change the interview type.

Claim verification is an internal evaluation layer only.
Do not return any additional claim-verification field.

Only return the evaluation.
""",
            },
        ],

        text_format=InterviewAnswerResponse,
    )

    return response.output_parsed