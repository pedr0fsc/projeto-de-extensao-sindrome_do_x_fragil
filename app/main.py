import os
import uvicorn
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from mangum import Mangum

from app.routers import auth, usuarios, pacientes, triagem, relatorios, instituicoes
from app.startup import init_db, init_seed_data, init_admin

app = FastAPI()
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY"),
    session_cookie="sxf_session",
    max_age=43200,
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(pacientes.router)
app.include_router(triagem.router)
app.include_router(relatorios.router)
app.include_router(instituicoes.router)

# ── Uploads ───────────────────────────────────────────────────────────────────
os.makedirs("uploads/pacientes", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── SPA ───────────────────────────────────────────────────────────────────────
if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith(("api/", "assets/")):
            raise HTTPException(status_code=404)
        file_path = f"frontend/dist/{full_path}"
        if os.path.exists(file_path) and not os.path.isdir(file_path):
            return FileResponse(file_path)
        return FileResponse("frontend/dist/index.html")
else:
    print("frontend/dist não encontrado - Rodando sem React")

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    init_db()
    init_seed_data()
    init_admin()

handler = Mangum(app)

if __name__ == "__main__":
    init_db()
    init_seed_data()
    init_admin()
    port = int(os.getenv("PORT", 3001))
    print(f"--- [APP] Iniciando servidor na porta {port} ---")
    uvicorn.run(app, host="0.0.0.0", port=port)
