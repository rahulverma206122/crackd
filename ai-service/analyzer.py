import os
import json

from dotenv import load_dotenv
from google import genai
from google.genai import types

from schemas import ResumeAnalysis


load_dotenv()


# =========================
# GEMINI CONFIGURATION
# =========================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")


if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing from environment variables"
    )


client = genai.Client(api_key=GEMINI_API_KEY)


# =========================
# SYSTEM PROMPT
# =========================

SYSTEM_PROMPT = """
You are an expert ATS and technical recruiting analyst.

Your job is to compare a candidate's resume against a job description.

Analyze only the information provided.

Important rules:

1. Never invent experience, projects, skills, certifications,
   employment history or achievements.

2. If a skill is not clearly supported by the resume,
   do not mark it as matched.

3. Distinguish between:
   - matched skills
   - partially supported skills
   - missing skills

4. The ATS score must represent how well the resume currently
   matches the supplied job description.

5. Consider:
   - technical skills
   - programming languages
   - frameworks
   - databases
   - cloud/devops
   - domain knowledge
   - job responsibilities
   - relevant projects
   - experience
   - education
   - important keywords

6. Do not punish the candidate simply because a keyword is
   expressed differently. Recognize reasonable semantic matches.

7. Recommendations must be truthful.
   Never recommend adding a skill unless the resume or user
   information supports it.

8. Do not rewrite the resume yet.
   This endpoint is only for analysis.

Return a structured analysis.
"""


# =========================
# GEMINI STRUCTURED RESPONSE
# =========================

def _generate_structured_response(
    system_prompt: str,
    user_prompt: str,
    response_schema,
):
    """
    Generate a structured response from Gemini using
    the supplied Pydantic schema.
    """

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.2,
        ),
    )

    # Gemini SDK may directly return a parsed Pydantic object
    parsed = getattr(response, "parsed", None)

    if parsed is not None:
        return parsed

    # Fallback: manually parse Gemini's JSON response
    response_text = getattr(response, "text", None)

    if not response_text:
        raise RuntimeError(
            "Gemini returned an empty response"
        )

    try:
        return response_schema.model_validate_json(response_text)

    except Exception:
        try:
            data = json.loads(response_text)
            return response_schema.model_validate(data)

        except Exception as exc:
            raise RuntimeError(
                f"Gemini returned invalid structured output: {exc}"
            ) from exc


# =========================
# RESUME ANALYSIS
# =========================

def analyze_resume(
    resume_text: str,
    job_description: str
) -> ResumeAnalysis:

    user_prompt = f"""
Analyze the following candidate resume against the job description.

====================
CANDIDATE RESUME
====================

{resume_text}

====================
JOB DESCRIPTION
====================

{job_description}

====================
TASK
====================

Provide:

- ATS compatibility score from 0 to 100
- Overall summary
- Matched skills
- Missing skills
- Partial skills
- Important matching keywords
- Important missing keywords
- Detailed skill analysis
- Resume strengths
- Resume gaps
- Specific recommendations

Base every conclusion only on the supplied resume and job description.
"""

    return _generate_structured_response(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        response_schema=ResumeAnalysis,
    )