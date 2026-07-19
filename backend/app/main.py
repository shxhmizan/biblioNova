from fastapi import FastAPI

from app.routers import analysis, health, sessions

app = FastAPI(title="BiblioAgent API")

app.include_router(health.router)
app.include_router(sessions.router)
app.include_router(analysis.router)
