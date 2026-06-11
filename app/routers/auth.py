import secrets
from datetime import datetime, timedelta
from urllib.parse import urlparse

from fastapi import APIRouter, BackgroundTasks, Depends, Request

from app.database import get_db
from app.helpers import hash_senha, enviar_email_smtp
from app.models import Usuario

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login")
async def api_login(request: Request, db=Depends(get_db)):
    body = await request.json()
    user = db.query(Usuario).filter(
        (Usuario.cpf == body["login"]) | (Usuario.email == body["login"]),
        Usuario.senha == hash_senha(body["senha"]),
        Usuario.ativo == True,
    ).first()
    if not user:
        return {"success": False, "error": "Usuário ou senha inválidos"}
    request.session.update({
        "user_logged_in": True,
        "id_usuario": user.id,
        "nome_usuario": user.nome,
        "tipo": user.tipo,
    })
    return {"success": True, "tipo": user.tipo, "nome": user.nome}


@router.post("/logout")
async def api_logout(request: Request):
    request.session.clear()
    return {"success": True}


@router.get("/check")
async def api_check(request: Request):
    if request.session.get("user_logged_in"):
        return {"logged_in": True, "tipo": request.session.get("tipo"), "nome": request.session.get("nome_usuario")}
    return {"logged_in": False}


@router.post("/password-reset/request")
async def api_password_reset_request(request: Request, background_tasks: BackgroundTasks, db=Depends(get_db)):
    body = await request.json()
    email_ou_cpf = body.get("login")
    user = db.query(Usuario).filter(
        (Usuario.email == email_ou_cpf) | (Usuario.cpf == email_ou_cpf.replace(".", "").replace("-", ""))
    ).first()
    if not user:
        return {"success": False, "not_found": True}

    token = secrets.token_urlsafe(32)
    user.token_recuperacao = token
    user.token_expiracao = datetime.now() + timedelta(hours=1)
    db.commit()

    referer = request.headers.get("referer")
    if referer:
        parsed = urlparse(referer)
        base = f"{parsed.scheme}://{parsed.netloc}" if parsed.netloc else f"{request.url.scheme}://{request.url.netloc}"
    else:
        base = f"{request.url.scheme}://{request.url.netloc}"
    link = f"{base}/recuperar-senha?token={token}"

    html_content = f"""
    <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #CDE0C9; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #2C6975; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Plataforma de Triagem SXF</h2>
        </div>
        <div style="padding: 24px; color: #323232; line-height: 1.6;">
            <p>Olá, <strong>{user.nome}</strong>,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta na Plataforma de Triagem Síndrome do X Frágil.</p>
            <p>Para criar uma nova senha, clique no botão abaixo (este link é válido por 1 hora):</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{link}" style="display: inline-block; padding: 12px 30px; background-color: #68B2A0; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Redefinir Senha
                </a>
            </div>
            <p style="font-size: 13px; color: #666;">Se o botão não funcionar, copie e cole:</p>
            <p style="font-size: 12px; color: #2C6975; word-break: break-all; background-color: #E0ECDE; padding: 10px; border-radius: 4px;">{link}</p>
            <p style="margin-top: 30px;">Se você não solicitou essa redefinição, ignore este e-mail.</p>
        </div>
        <div style="border-top: 1px solid #E0ECDE; padding: 15px; text-align: center; color: #777777; font-size: 12px;">
            <p style="margin: 0;">Instituto Buko Kaesemodel</p>
        </div>
    </div>
    """
    text_content = (
        f"Olá, {user.nome},\n\nPara redefinir sua senha acesse (válido por 1 hora):\n{link}\n\n"
        f"Se não solicitou, ignore este e-mail.\n\nInstituto Buko Kaesemodel"
    )
    background_tasks.add_task(
        enviar_email_smtp, user.email,
        "Recuperação de Senha - Plataforma de Triagem SXF",
        html_content, text_content
    )
    return {"success": True}


@router.post("/password-reset/reset")
async def api_password_reset_reset(request: Request, db=Depends(get_db)):
    body = await request.json()
    user = db.query(Usuario).filter(
        Usuario.token_recuperacao == body.get("token"),
        Usuario.token_expiracao > datetime.now()
    ).first()
    if not user:
        return {"success": False, "error": "Token inválido ou expirado"}
    user.senha = hash_senha(body.get("senha"))
    user.token_recuperacao = None
    user.token_expiracao = None
    db.commit()
    return {"success": True}
