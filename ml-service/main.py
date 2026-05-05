from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import predict
import uvicorn
import os

app = FastAPI(title="VentureSpan ML Service", version="1.0.0")

# IMPORTANT: allow the deployed frontend too (not just localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "https://venture-span-frontend.vercel.app",  # <-- your Vercel URL
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(predict.router)

# Health check
@app.get("/health")
def health():
    return {"status": "ok"}

# Railway-compatible startup
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

