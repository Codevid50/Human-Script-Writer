"""Custom exceptions for Human Script System."""

class ScriptGenerationError(Exception):
    """Base exception for script generation errors."""

    def __init__(self, message: str, details: str = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class APIError(ScriptGenerationError):
    """Error from external API (OpenRouter)."""

    def __init__(self, message: str, status_code: int = 500, details: str = None):
        self.status_code = status_code
        super().__init__(message, details)


class RateLimitError(APIError):
    """Rate limit exceeded error from OpenRouter."""

    def __init__(self, message: str = "OpenRouter rate limit exceeded", details: str = None, retry_after: int = None):
        self.retry_after = retry_after
        super().__init__(
            message=message,
            details=details,
            status_code=429
        )


class TimeoutError(ScriptGenerationError):
    """Timeout error when AI service takes too long."""

    def __init__(self, message: str = "OpenRouter API request timed out", details: str = None):
        super().__init__(message, details)


class InvalidResponseError(ScriptGenerationError):
    """Error when AI returns invalid or empty response."""

    def __init__(self, message: str = "AI returned invalid or empty response", details: str = None):
        super().__init__(message, details)


class ValidationError(ScriptGenerationError):
    """Error when request data is invalid."""

    def __init__(self, message: str = "Invalid request data", details: str = None):
        super().__init__(message, details)