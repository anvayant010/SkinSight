import mimetypes

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
from app.storage import store_analyze_backup, store_track_backup

app = FastAPI(title="SkinSight AI MVP", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _is_image_upload(file: UploadFile) -> bool:
    if file.content_type and file.content_type.startswith("image/"):
        return True
    guessed, _ = mimetypes.guess_type(file.filename or "")
    return bool(guessed and guessed.startswith("image/"))


@app.get("/")
def read_root():
    return {"message": "SkinSight AI API is running. Use /docs for API documentation."}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResult)
async def analyze(file: UploadFile = File(...)) -> AnalysisResult:
    if not _is_image_upload(file):
        raise HTTPException(status_code=400, detail="Please upload an image file")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    try:
        result = analyze_image(data)
        store_analyze_backup(
            source_filename=file.filename or "upload.jpg",
            source_content_type=file.content_type,
            image_bytes=data,
            result=result,
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc


@app.post("/track", response_model=ProgressReport)
async def track(
    baseline: UploadFile = File(...),
    followup: UploadFile = File(...),
) -> ProgressReport:
    if not _is_image_upload(baseline):
        raise HTTPException(status_code=400, detail="Baseline must be an image file")
    if not _is_image_upload(followup):
        raise HTTPException(status_code=400, detail="Follow-up must be an image file")

    baseline_data = await baseline.read()
    followup_data = await followup.read()

    if not baseline_data:
        raise HTTPException(status_code=400, detail="Baseline image is empty")
    if not followup_data:
        raise HTTPException(status_code=400, detail="Follow-up image is empty")

    try:
        result = compare_progress(baseline_data, followup_data)
        store_track_backup(
            baseline_filename=baseline.filename or "baseline.jpg",
            baseline_content_type=baseline.content_type,
            baseline_image_bytes=baseline_data,
            followup_filename=followup.filename or "followup.jpg",
            followup_content_type=followup.content_type,
            followup_image_bytes=followup_data,
            result=result,
        )
        return result
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
