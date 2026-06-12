import os
import uvicorn
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from mangum import Mangum

from backend.init import init_db, init_seed_data, init_admin
from backend.routers import router

# ── App Configuration ─────────────────────────────────────────────────────────
app = FastAPI(title="Plataforma de Triagem SXF")

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "sxf-default-secret-key"),
    session_cookie="sxf_session",
    max_age=43200  # 12 horas
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(router)

# ── Uploads & Static Storage ─────────────────────────────────────────────────
os.makedirs("sxf_fotos_pacientes", exist_ok=True)
os.makedirs("uploads", exist_ok=True)

app.mount("/sxf_fotos_pacientes", StaticFiles(directory="sxf_fotos_pacientes"), name="sxf_fotos_pacientes")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Static files / SPA (Frontend Build) ──────────────────────────────────────
if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith(("api/", "assets/", "sxf_fotos_pacientes/", "uploads/")):
            raise HTTPException(status_code=404)

        file_path = f"frontend/dist/{full_path}"
        if os.path.exists(file_path) and not os.path.isdir(file_path):
            return FileResponse(file_path)

        return FileResponse("frontend/dist/index.html")
else:
    print("--- [WARNING] frontend/dist não encontrado. SPA não será servido. ---")

# ── Entry Points & Mangum Handler ───────────────────────────────────────────
handler = Mangum(app)

if __name__ == "__main__":
    print("--- [APP] Iniciando inicialização do sistema ---")
    init_db()
    init_seed_data()
    init_admin()

    port = int(os.getenv("PORT", 3001))
    print(f"--- [APP] Servidor rodando em http://0.0.0.0:{port} ---")
    uvicorn.run(app, host="0.0.0.0", port=port)
