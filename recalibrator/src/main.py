"""HormuzPT Recalibrator — FastAPI service on port 8082."""

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .models.state import ModelState
from .pipeline.orchestrator import run_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("recalibrator")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Recalibrator starting (env=%s, port=%s)", settings.env, settings.port
    )
    yield
    logger.info("Recalibrator shutting down")


app = FastAPI(
    title="HormuzPT Recalibrator",
    description="Model recalibration and scenario computation engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "hormuzpt-recalibrator",
        "env": settings.env,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/recalibrate")
async def recalibrate(dry_run: bool = Query(False)):
    """
    Execute the weekly recalibration pipeline.

    - dry_run=true: full pipeline without writing changes
    - dry_run=false: apply changes if risk allows
    """
    try:
        result = await run_pipeline(dry_run=dry_run)
        return result
    except Exception as e:
        logger.exception("Recalibration failed")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Recalibration failed: {str(e)}")


@app.get("/model-state")
async def get_model_state():
    """Return the current model state (baseline defaults)."""
    state = ModelState()
    return {
        "source": "local",
        "state": state.model_dump(),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=settings.port)
