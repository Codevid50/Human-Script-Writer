import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import compatibility_router, router as api_router
from app.core.config import CORS_ORIGINS

app = FastAPI(
    title="Human Script System",
    description="AI-powered script generator for YouTube and TikTok content creators",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(compatibility_router)


@app.get("/")
async def root():
    return {"message": "Human Script System API - Generate YouTube and TikTok scripts"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
    )
