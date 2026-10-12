"""API routes for Human Script System."""

from fastapi import APIRouter, HTTPException, status

from app.schemas import ScriptRequest, ScriptResponse
from app.services.ai_service import (
    generate_script,
    AIServiceError,
    AIRateLimitError,
    AIAuthenticationError,
    AIModelUnavailableError,
    AIEmptyResponseError,
)


router = APIRouter(prefix="/api", tags=["script"])
compatibility_router = APIRouter(tags=["script"])


def _handle_script_error(error: Exception) -> HTTPException:
    """Convert custom exceptions to proper HTTP responses."""

    if isinstance(error, AIRateLimitError):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "message": str(error),
            },
        )

    if isinstance(error, AIAuthenticationError):
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Authentication failed",
                "message": str(error),
            },
        )

    if isinstance(error, AIModelUnavailableError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "Model unavailable",
                "message": str(error),
            },
        )

    if isinstance(error, AIEmptyResponseError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Empty AI response",
                "message": str(error),
            },
        )

    if isinstance(error, AIServiceError):
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "AI service error",
                "message": str(error),
            },
        )

    # Fallback for unexpected errors
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={
            "error": "Unexpected error",
            "message": str(error),
        },
    )


@router.post(
    "/generate-script",
    response_model=ScriptResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a script",
    description="Generate a short-form or long-form video script using AI.",
)
async def generate_script_endpoint(request: ScriptRequest):
    """
    Generate a script from user input.

    Takes topic, description, content type, and optional main points,
    then returns a structured script.
    """
    try:
        return generate_script(request)
    except Exception as e:
        raise _handle_script_error(e)


compatibility_router.add_api_route(
    "/generate",
    generate_script_endpoint,
    methods=["POST"],
    response_model=ScriptResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a script",
    description="Compatibility endpoint for script generation.",
)