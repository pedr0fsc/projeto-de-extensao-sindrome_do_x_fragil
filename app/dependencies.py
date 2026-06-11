from fastapi import HTTPException, Request


def require_auth(request: Request):
    if not request.session.get("user_logged_in"):
        raise HTTPException(status_code=401, detail="Não autorizado")


def require_admin(request: Request):
    if not request.session.get("user_logged_in") or request.session.get("tipo") != "Administrador":
        raise HTTPException(status_code=401, detail="Não autorizado")
