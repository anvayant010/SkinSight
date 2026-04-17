from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.pipeline import analyze_image, compare_progress
from app.reporting import generate_detailed_report
from app.schemas import (
    AnalysisResult,
    DetailedReportRequest,
    DetailedReportResponse,
    ProgressReport,
)

app = FastAPI(title="SkinSight AI MVP", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "SkinSight AI API is running. Use /docs for API documentation."}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResult)
async def analyze(file: UploadFile = File(...)) -> AnalysisResult:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    try:
        return analyze_image(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc


@app.post("/track", response_model=ProgressReport)
async def track(
    baseline: UploadFile = File(...),
    followup: UploadFile = File(...),
) -> ProgressReport:
    if not baseline.content_type or not baseline.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Baseline must be an image file")
    if not followup.content_type or not followup.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Follow-up must be an image file")

    baseline_data = await baseline.read()
    followup_data = await followup.read()

    if not baseline_data:
        raise HTTPException(status_code=400, detail="Baseline image is empty")
    if not followup_data:
        raise HTTPException(status_code=400, detail="Follow-up image is empty")

    try:
        return compare_progress(baseline_data, followup_data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Progress tracking failed: {exc}"
        ) from exc


@app.post("/report", response_model=DetailedReportResponse)
async def detailed_report(payload: DetailedReportRequest) -> DetailedReportResponse:
    try:
        return generate_detailed_report(payload.analysis)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Detailed report generation failed: {exc}",
        ) from exc
