import os

from dotenv import load_dotenv
from openai import OpenAI

from schemas import ResumeAnalysis


load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
model = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")

if not api_key:
    raise RuntimeError(
        "OPENAI_API_KEY is missing from environment variables"
    )

client = OpenAI(api_key=api_key)


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


def analyze_resume(resume_text: str, job_description: str) -> ResumeAnalysis:

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

    response = client.responses.parse(
        model=model,
        input=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        text_format=ResumeAnalysis,
    )

    for output in response.output:
        if output.type != "message":
            continue

        for content in output.content:
            if content.type != "output_text":
                continue

            if content.parsed:
                return content.parsed

    raise RuntimeError(
        "OpenAI returned no structured analysis"
    )