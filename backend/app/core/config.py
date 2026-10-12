import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenRouter API configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# Application settings
APP_NAME = os.getenv("APP_NAME", "Human Script System")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Base CORS origins for local development (will be merged with production origins below)
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Production CORS origins from environment variable (e.g., Render frontend URL)
# Add your Render URL here: https://your-app.onrender.com
PRODUCTION_CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

# Combine defaults with production origins (production origins take precedence if duplicate)
CORS_ORIGINS = list(dict.fromkeys(DEFAULT_CORS_ORIGINS + PRODUCTION_CORS_ORIGINS))

# Default script settings
DEFAULT_LONG_FORM_DURATION = int(os.getenv("DEFAULT_LONG_FORM_DURATION", "8"))
DEFAULT_SHORT_FORM_DURATION = int(os.getenv("DEFAULT_SHORT_FORM_DURATION", "45"))