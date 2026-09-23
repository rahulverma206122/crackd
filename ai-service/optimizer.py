import os
import json

from dotenv import load_dotenv
from google import genai
from google.genai import types

from schemas import ResumeOptimization


# =========================
# ENVIRONMENT
# =========================

load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.6-flash"
)


if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY is not configured"
    )


# =========================
# GEMINI CLIENT
# =========================

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# =========================
# SYSTEM PROMPT
# =========================

SYSTEM_PROMPT = """
You are an expert resume optimization assistant.

Your job is to improve a candidate's existing resume for a specific
job description.

IMPORTANT RULES:

1. NEVER invent information.

2. NEVER create fake:
   - skills
   - projects
   - internships
   - jobs
   - technologies
   - certifications
   - achievements
   - metrics
   - responsibilities

3. Only use information that already exists in the candidate's resume.

4. Do NOT rewrite the entire resume.

5. Only identify meaningful improvements.

6. If a resume line is already good and relevant, DO NOT suggest a change.

7. For every suggested change:
   - provide the exact original text
   - provide the improved replacement
   - explain why the replacement is better

8. Improvements should focus on:
   - relevance to the job description
   - clarity
   - stronger wording
   - ATS keyword alignment
   - better presentation of existing experience

9. Do not force keywords into the resume.

10. A keyword can only go into keywords_to_add if the resume
    contains evidence supporting that keyword.

11. Put unsupported skills/technologies into keywords_not_supported.

12. Keep suggestions concise and practical.

13. Prefer a small number of high-value suggestions over many
    unnecessary suggestions.

14. If there are no meaningful changes for a section, do not create
    a suggestion for that section.

15. Never change factual meaning.

The final output must be structured according to the provided schema.
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

    # Gemini may directly return a parsed Pydantic object
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
        return response_schema.model_validate_json(
            response_text
        )

    except Exception:
        try:
            data = json.loads(response_text)

            return response_schema.model_validate(
                data
            )

        except Exception as exc:
            raise RuntimeError(
                f"Gemini returned invalid structured output: {exc}"
            ) from exc


# =========================
# RESUME OPTIMIZATION
# =========================

def optimize_resume(
    resume_text: str,
    job_description: str
):
    user_prompt = f"""
CANDIDATE RESUME:

{resume_text}


TARGET JOB DESCRIPTION:

{job_description}


Analyze the resume against the job description.

Return only meaningful optimization suggestions.

For each real issue, provide:

- section
- exact original text
- improved replacement
- reason

Do not suggest unnecessary changes.

Also provide:

1. Keywords that can truthfully be added.
2. Important keywords that are not supported by the resume.
3. Only important ATS improvements.
"""

    return _generate_structured_response(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        response_schema=ResumeOptimization,
    )