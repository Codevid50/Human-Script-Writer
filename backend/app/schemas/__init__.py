"""Pydantic schemas for Human Script System API."""

from typing import List, Optional

from pydantic import BaseModel


class ScriptRequest(BaseModel):
    """Schema for the request body sent from frontend to API.

    This model represents what the user sends when they want to generate a script.
    """

    content_type: str
    """Type of content: "short" for short-form (TikTok, Reels) or "long" for long-form (YouTube videos)."""

    topic: str
    """The main topic or theme of the video script."""

    description: str
    """A short description explaining the idea in more detail."""

    duration: Optional[str] = None

    main_points: Optional[List[str]] = None
    """Optional list of main points the user wants covered in the script.
    Users can optionally provide key points they want included."""

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
    "example": {
        "content_type": "short",
        "topic": "AI in Healthcare",
        "description": "How AI is transforming patient care and diagnostics",
        "duration": "45 seconds",
        "main_points": ["faster diagnosis", "personalized treatment", "cost reduction"],
    }
}


class ScriptResponse(BaseModel):
    """Schema for the response body returned by the API.

    This model represents what the API sends back after generating a script.
    """

    script: str
    """The generated script text."""

    content_type: str
    """The content type that was used (short or long)."""

    word_count: int
    """Number of words in the generated script."""

    reading_time_minutes: float
    """Estimated reading time in minutes based on word count."""

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "script": "Opening scene: [Visual of hospital corridor]...",
                "content_type": "long",
                "word_count": 842,
                "reading_time_minutes": 4.5,
            }
        }