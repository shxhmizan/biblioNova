from fastapi import FastAPI

from app.routers import analysis, chat, health, sessions

app = FastAPI(title="BiblioAgent API")

app.include_router(health.router)
app.include_router(sessions.router)
app.include_router(analysis.router)
app.include_router(chat.router)
