import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing")

model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

client = genai.Client(api_key=api_key)

response = client.models.generate_content(
    model=model,
    contents="Say hello in one short sentence."
)

print("Gemini model:", model)
print("Gemini response:")
print(response.text)