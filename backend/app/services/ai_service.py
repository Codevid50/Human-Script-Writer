"""
AI Service for Human Script System.

Handles communication with OpenRouter to generate video scripts.
Written in the same robust style as the previous working project.
"""

import os
import re
import time
import logging
from typing import Optional

from dotenv import load_dotenv
from openai import (
    OpenAI,
    APIError,
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    APITimeoutError,
)

from app.schemas import ScriptRequest, ScriptResponse


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")

if not api_key:
    raise ValueError(
        "OPENROUTER_API_KEY is not set in the environment."
    )


# ============================================================
# CONFIGURATION
# ============================================================

MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")

MAX_RETRIES = 4
BASE_WAIT_SECONDS = 5
MAX_WAIT_SECONDS = 30
REQUEST_TIMEOUT_SECONDS = 90.0


# ============================================================
# OPENROUTER CLIENT
# ============================================================

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
    timeout=REQUEST_TIMEOUT_SECONDS,
    max_retries=0,  # we handle retries ourselves
)


# ============================================================
# CUSTOM EXCEPTIONS
# ============================================================

class AIServiceError(Exception):
    """Base exception for AI service errors."""


class AIRateLimitError(AIServiceError):
    """Raised when rate limited."""


class AIAuthenticationError(AIServiceError):
    """Raised when API key is invalid."""


class AIModelUnavailableError(AIServiceError):
    """Raised when model is not found."""


class AIEmptyResponseError(AIServiceError):
    """Raised when AI returns empty content."""


# ============================================================
# PROMPT BUILDER
# ============================================================

# ============================================================
# SCRIPTWRITING KNOWLEDGE & GUIDELINES
# ============================================================

SCRIPTWRITING_RULES = """
CORE SCRIPTWRITING RULES:
1. Speakable Cadence: Write in short, natural, conversational sentences. Use contractions (it's, don't, you'll, we're).
2. Pacing: Target roughly 130–150 words per minute of speaking time.
3. High-Impact Hook: Grab attention immediately in the first sentence. No boring filler or introductions (e.g., NEVER write "Hey guys, welcome back to my channel").
4. Visual Layout: Write one spoken thought per line. This makes the text easy to read off a teleprompter or phone.
5. No Non-Spoken Text: Strictly write ONLY the words to be spoken. No stage directions, camera instructions, or speaker labels.
"""

SHORT_FORM_EXAMPLE = """
EXAMPLE OF A GREAT SHORT SCRIPT:
HOOK:
-----
Stop using the standard ChatGPT prompt if you want actual good results.

MAIN BODY:
-----
Most people just type a lazy question and expect magic.
Instead, try giving the AI a clear role, strict rules, and a target format.
For example, tell it: "You are a senior editor. Critique my writing for clarity and cut 20% of the filler."
You'll instantly get responses that feel written by an expert rather than a generic bot.

CTA:
-----
Save this video so you can fix your prompts next time you write.
"""

YOUTUBE_EXAMPLE = """
EXAMPLE OF A GREAT YOUTUBE SCRIPT:
HOOK:
-----
Most creators fail on YouTube not because their content is bad, but because their scripts are boring.

MAIN BODY:
-----
If you can't keep a viewer's attention in the first fifteen seconds, the algorithm moves on.
The secret isn't fancy editing. It's structural pacing.
Start with a high-stakes question, deliver immediate value, and cut out all unnecessary fluff.
Keep your sentences under ten words whenever possible to maintain momentum.

CTA:
-----
If you want to level up your script writing, hit subscribe for more breakdown videos like this.
"""


# ============================================================
# PROMPT BUILDER
# ============================================================

def build_system_prompt(request: ScriptRequest) -> str:
    points = ", ".join(request.main_points) if request.main_points else "key points"
    duration_str = f"approximately {request.duration}" if request.duration else "a standard length"

    if request.content_type == "short":
        return f"""You are an expert short-form scriptwriter (TikTok, Instagram Reels, YouTube Shorts).

Output ONLY the final script. Do not explain. Do not think out loud. Do not add any extra text.

{SCRIPTWRITING_RULES}

{SHORT_FORM_EXAMPLE}

---

TASK DETAILS:
Topic: {request.topic}
Description: {request.description}
Main points: {points}
Target Duration: {duration_str}

Write a spoken script suitable for {duration_str} of speaking time in this EXACT format:

HOOK:
-----
(strong opening lines)

MAIN BODY:
-----
(main content)

CTA:
-----
(ending question or soft call to action)
"""
    else:
        return f"""You are an expert long-form YouTube scriptwriter.

Output ONLY the final script. Do not explain. Do not think out loud. Do not add any extra text.

{SCRIPTWRITING_RULES}

{YOUTUBE_EXAMPLE}

---

TASK DETAILS:
Topic: {request.topic}
Description: {request.description}
Main points: {points}
Target Duration: {duration_str}

Write a spoken script suitable for {duration_str} of speaking time in this EXACT format:

HOOK:
-----
(strong opening)

MAIN BODY:
-----
(main content with clear flow)

CTA:
-----
(ending call to action)
"""

# ============================================================
# RESPONSE CLEANING
# ============================================================

def clean_script_response(content: str) -> str:
    """
    Clean AI output:
    - Remove <think> blocks
    - Remove markdown code fences
    - Strip extra whitespace
    """
    content = re.sub(
        r"<think>.*?</think>",
        "",
        content,
        flags=re.DOTALL | re.IGNORECASE,
    )

    content = content.strip()

    content = re.sub(r"^```(?:\w+)?\s*\n?", "", content)
    content = re.sub(r"\n?```\s*$", "", content)

    return content.strip()


# ============================================================
# CORE AI REQUEST WITH RETRIES
# ============================================================

def _request_script(prompt: str, system_prompt: str) -> str:
    """
    Send request to OpenRouter with a curated pool of text models
    to prevent routers from accidentally hitting classifiers.
    """

    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model=MODEL,  # Typically "openrouter/free"
                extra_body={
                    "models": [
                        "google/gemma-2-9b-it:free",
                        "meta-llama/llama-3-8b-instruct:free",
                        "mistralai/mistral-7b-instruct:free"
                    ]
                },
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=1500,
            )

            if not response.choices:
                raise AIEmptyResponseError("AI returned no choices.")

            content = response.choices[0].message.content

            if not content or not content.strip():
                raise AIEmptyResponseError("AI returned an empty response.")

            cleaned = clean_script_response(content)

            if not cleaned:
                raise AIEmptyResponseError("AI returned empty script after cleaning.")

            return cleaned

        except AuthenticationError as error:
            raise AIAuthenticationError(
                "Invalid API key. Check your OPENROUTER_API_KEY."
            ) from error

        except NotFoundError as error:
            raise AIModelUnavailableError(
                f"Model unavailable: {MODEL}. Error: {error}"
            ) from error

        except RateLimitError as error:
            last_error = error

        except APITimeoutError as error:
            last_error = error

        except APIError as error:
            last_error = error

        except AIEmptyResponseError as error:
            last_error = error

        except Exception as error:
            last_error = error

        # Retry with exponential backoff
        if attempt < MAX_RETRIES - 1:
            wait_time = min(
                BASE_WAIT_SECONDS * (2 ** attempt),
                MAX_WAIT_SECONDS,
            )
            logging.warning(
                f"AI request failed ({type(last_error).__name__}: {str(last_error)[:200]}). "
                f"Retrying in {wait_time}s (attempt {attempt + 1}/{MAX_RETRIES})..."
            )
            time.sleep(wait_time)

    # All retries failed
    if isinstance(last_error, RateLimitError):
        raise AIRateLimitError(
            "Rate limit reached. Please try again later or switch model."
        ) from last_error

    raise AIServiceError(
        f"AI request failed after {MAX_RETRIES} attempts: {last_error}"
    ) from last_error


# ============================================================
# MAIN FUNCTION
# ============================================================

def generate_script(request: ScriptRequest) -> ScriptResponse:
    """
    Generate a script using OpenRouter.
    """

    system_prompt = build_system_prompt(request)
    user_message = "Output only the final script in the required format. Nothing else."

    generated_script = _request_script(
        prompt=user_message,
        system_prompt=system_prompt,
    )

    word_count = len(generated_script.split())
    reading_time = round(word_count / 130, 2)

    return ScriptResponse(
        script=generated_script,
        content_type=request.content_type,
        word_count=word_count,
        reading_time_minutes=reading_time,
    )