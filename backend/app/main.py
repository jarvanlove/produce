from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.database import engine, Base
from app.routers import auth, classes, import_data, dashboard, risk, heatmap, students, reports, knowledge_points, settings as settings_router
from app.utils.security import get_current_user

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5176", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check (must be before static mount)
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": settings.VERSION}


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Routers — auth公开，其余需JWT鉴权
app.include_router(auth.router)
app.include_router(classes.router, dependencies=[Depends(get_current_user)])
app.include_router(import_data.router, dependencies=[Depends(get_current_user)])
app.include_router(dashboard.router, dependencies=[Depends(get_current_user)])
app.include_router(risk.router, dependencies=[Depends(get_current_user)])
app.include_router(heatmap.router, dependencies=[Depends(get_current_user)])
app.include_router(students.router, dependencies=[Depends(get_current_user)])
app.include_router(reports.router, dependencies=[Depends(get_current_user)])
app.include_router(knowledge_points.router, dependencies=[Depends(get_current_user)])
app.include_router(settings_router.router, dependencies=[Depends(get_current_user)])

# Static files (frontend build) — mount LAST so it doesn't shadow API routes
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
