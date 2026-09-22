import os

from dotenv import load_dotenv
from openai import OpenAI

from schemas import ResumeOptimization


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


def optimize_resume(
    resume_text: str,
    job_description: str
):
    response = client.responses.parse(
        model=OPENAI_MODEL,

        input=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": f"""
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
""",
            },
        ],

        text_format=ResumeOptimization,
    )

    return response.output_parsed