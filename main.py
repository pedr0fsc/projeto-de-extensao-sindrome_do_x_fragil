import os
import secrets
import smtplib
from datetime import datetime, timedelta
from hashlib import sha256
from io import BytesIO

from dotenv import load_dotenv
load_dotenv()

from fastapi import Depends, FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import (
    Boolean, Column, Date, DateTime, DECIMAL, ForeignKey,
    Integer, String, Text, Enum as SQLEnum, create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from mangum import Mangum
from dotenv import load_dotenv
load_dotenv()



# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI()
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY"),
    session_cookie="sxf_session",
    max_age=43200 # 12 horas
)

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL = (
    f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# ── Models ────────────────────────────────────────────────────────────────────
class Usuario(Base):
    __tablename__ = "usuario"
    id = Column(Integer, primary_key=True)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False)
    senha = Column(String(255), nullable=False)
    ativo = Column(Boolean, default=True)
    telefone = Column(String(24), nullable=False)
    email = Column(String(150), nullable=False)
    tipo = Column(SQLEnum("Médico", "Administrador"), nullable=False)
    token_recuperacao = Column(String(100), unique=True)
    token_expiracao = Column(DateTime)
    criado_em = Column(DateTime, default=datetime.now)


class Medico(Base):
    __tablename__ = "medico"
    id = Column(Integer, ForeignKey("usuario.id"), primary_key=True)
    crm = Column(String(13), unique=True, nullable=False)
    usuario = relationship("Usuario")


class Paciente(Base):
    __tablename__ = "paciente"
    id = Column(Integer, primary_key=True)
    id_medico_responsavel = Column(Integer, ForeignKey("medico.id"), nullable=False)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False)
    sexo = Column(SQLEnum("Feminino", "Masculino"), name='sexo_biologico', nullable=False)
    data_nascimento = Column(Date, nullable=False)
    telefone = Column(String(24), nullable=False)
    email = Column(String(150), nullable=False)
    criado_em = Column(DateTime, default=datetime.now)
    medico = relationship("Medico")


class Sintoma(Base):
    __tablename__ = "sintomas"
    id = Column(Integer, primary_key=True)
    nome = Column(String(135), nullable=False)
    peso_masculino = Column(DECIMAL(3, 2))
    peso_feminino = Column(DECIMAL(3, 2))


class Limiar(Base):
    __tablename__ = "limiar"
    id = Column(Integer, primary_key=True)
    sexo = Column(SQLEnum("Feminino", "Masculino"), nullable=False)
    valor = Column(DECIMAL(3, 2), nullable=False)


class Triagem(Base):
    __tablename__ = "triagem"
    id = Column(Integer, primary_key=True)
    id_medico = Column(Integer, ForeignKey("medico.id"), nullable=False)
    id_paciente = Column(Integer, ForeignKey("paciente.id"), nullable=False)
    nome_responsavel = Column(String(100))
    grau_responsavel = Column(String(100))
    observacoes = Column(Text)
    realizada_em = Column(DateTime, default=datetime.now)
    medico = relationship("Medico")
    paciente = relationship("Paciente")


class TriagemSintoma(Base):
    __tablename__ = "triagem_sintoma"
    id_sintoma = Column(Integer, ForeignKey("sintomas.id"), primary_key=True)
    id_triagem = Column(Integer, ForeignKey("triagem.id"), primary_key=True)
    presente = Column(Boolean, nullable=False)


class Resultado(Base):
    __tablename__ = "resultado"
    id = Column(Integer, primary_key=True)
    id_triagem = Column(Integer, ForeignKey("triagem.id"), nullable=False)
    limiar = Column(DECIMAL(3, 2), nullable=False)
    score_total = Column(DECIMAL(3, 2), nullable=False)
    atingiu_limiar = Column(Boolean, nullable=False)
    justificativa = Column(String(100))
    gerado_em = Column(DateTime, default=datetime.now)
    triagem = relationship("Triagem")


class Notificacao(Base):
    __tablename__ = "notificacao"
    id = Column(Integer, primary_key=True)
    id_resultado = Column(Integer, ForeignKey("resultado.id"), nullable=False)
    destinatario = Column(String(150), nullable=False)
    enviado_em = Column(DateTime)


# ── Dependencies ──────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_auth(request: Request):
    if not request.session.get("user_logged_in"):
        raise HTTPException(status_code=401, detail="Não autorizado")


def require_admin(request: Request):
    if not request.session.get("user_logged_in") or request.session.get("tipo") != "Administrador":
        raise HTTPException(status_code=401, detail="Não autorizado")


# ── Helpers ───────────────────────────────────────────────────────────────────
def hash_senha(senha: str) -> str:
    return sha256(senha.encode()).hexdigest()


def get_limiar(db, sexo: str) -> float:
    limiar = db.query(Limiar).filter(Limiar.sexo == sexo).first()
    return float(limiar.valor) if limiar else (0.56 if sexo == "Masculino" else 0.55)


def calcular_score(sintomas_marcados: dict, sexo: str, db) -> float:
    score = sum(
        (float(s.peso_masculino) if sexo == "Masculino" else float(s.peso_feminino or 0))
        for s in db.query(Sintoma).all()
        if sintomas_marcados.get(str(s.id))
    )
    return round(score, 3)


def enviar_email_smtp(to_email: str, subject: str, html_content: str, text_content: str = "") -> bool:
    if not to_email:
        return False
    
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or smtp_user or "noreply@sxf.org"

    if not smtp_host or not smtp_user or not smtp_password:
        print("\n" + "="*80)
        print(" [SIMULADOR DE EMAIL] SMTP não configurado no arquivo .env!")
        print(f" Destinatário: {to_email}")
        print(f" Assunto: {subject}")
        print(f" Mensagem:\n{text_content or html_content[:400]}")
        print("="*80 + "\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_from
        msg["To"] = to_email

        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        if html_content:
            msg.attach(MIMEText(html_content, "html"))

        port = int(smtp_port) if smtp_port else 587
        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port)
        else:
            server = smtplib.SMTP(smtp_host, port)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, to_email, msg.as_string())
        server.quit()
        print(f"[EMAIL] E-mail enviado com sucesso para: {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Falha ao enviar e-mail para {to_email}: {e}")
        return False


def enviar_email(destino: str, nome: str, score: float, recomendacao: str, limiar: float) -> bool:
    cor_score = "#ff6b6b" if score >= limiar else "#2C6975"
    
    html_content = f"""
    <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #CDE0C9; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #2C6975; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Resultado da Triagem SXF</h2>
        </div>
        <div style="padding: 24px; color: #323232; line-height: 1.6;">
            <p>Prezado(a) responsável pelo paciente <strong>{nome}</strong>,</p>
            <p>O resultado da triagem clínica para a Síndrome do X Frágil foi gerado com sucesso pelo sistema.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #E0ECDE;">
                    <td style="padding: 10px; border: 1px solid #CDE0C9; font-weight: bold;">Paciente</td>
                    <td style="padding: 10px; border: 1px solid #CDE0C9;">{nome}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #CDE0C9; font-weight: bold;">Score Clínico Obtido</td>
                    <td style="padding: 10px; border: 1px solid #CDE0C9; font-weight: bold; color: {cor_score};">{score:.3f}</td>
                </tr>
                <tr style="background-color: #E0ECDE;">
                    <td style="padding: 10px; border: 1px solid #CDE0C9; font-weight: bold;">Limiar de Risco</td>
                    <td style="padding: 10px; border: 1px solid #CDE0C9;">{limiar}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #CDE0C9; font-weight: bold;">Recomendação</td>
                    <td style="padding: 10px; border: 1px solid #CDE0C9; font-weight: bold; color: {cor_score};">{recomendacao}</td>
                </tr>
            </table>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #68B2A0; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 14px; color: #555;"><strong>Nota Importante:</strong> Esta triagem clínica não é um diagnóstico definitivo. É uma ferramenta de triagem para avaliar a probabilidade e recomendar ou não a realização do exame molecular de DNA (FMR1 PCR).</p>
            </div>
        </div>
        <div style="border-top: 1px solid #E0ECDE; padding: 15px; text-align: center; color: #777777; font-size: 12px;">
            <p style="margin: 0;">Instituto Buko Kaesemodel</p>
        </div>
    </div>
    """
    
    text_content = (
        f"Paciente: {nome}\n"
        f"Score: {score:.3f}\n"
        f"Limiar: {limiar}\n"
        f"Recomendação: {recomendacao}\n\n"
        f"Instituto Buko Kaesemodel"
    )
    
    subject = f"Resultado Triagem SXF - {nome}"
    return enviar_email_smtp(destino, subject, html_content, text_content)



def gerar_pdf(nome, data_nasc, sexo, score, recomendacao, medico, obs, limiar) -> BytesIO:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(200, 800, "Relatório Triagem - SXF")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, 750, f"Paciente: {nome}")
    pdf.drawString(50, 730, f"Nascimento: {data_nasc}")
    pdf.drawString(50, 710, f"Sexo: {sexo}")
    pdf.drawString(50, 690, f"Médico: {medico}")
    pdf.drawString(50, 670, f"Data: {datetime.now().strftime('%d/%m/%Y')}")
    pdf.line(50, 650, 550, 650)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, 620, f"Score: {score:.3f} (Limiar: {limiar})")
    if "ENCAMINHAR" in recomendacao:
        pdf.setFillColorRGB(1, 0, 0)
    else:
        pdf.setFillColorRGB(0, 0.5, 0)
    pdf.drawString(50, 590, recomendacao)
    pdf.setFillColorRGB(0, 0, 0)
    pdf.setFont("Helvetica", 10)
    pdf.drawString(50, 560, f"Observações: {obs or 'Nenhuma'}")
    pdf.save()
    buffer.seek(0)
    return buffer


# ── Routes ────────────────────────────────────────────────────────────────────
@app.post("/api/login")
async def api_login(request: Request, db=Depends(get_db)):
    body = await request.json()
    senha_hash = hash_senha(body["senha"])
    user = db.query(Usuario).filter(
        (Usuario.cpf == body["login"]) | (Usuario.email == body["login"]),
        Usuario.senha == senha_hash,
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





@app.post("/api/logout")
async def api_logout(request: Request):
    request.session.clear()
    return {"success": True}


@app.get("/api/check")
async def api_check(request: Request):
    if request.session.get("user_logged_in"):
        return {"logged_in": True, "tipo": request.session.get("tipo"), "nome": request.session.get("nome_usuario")}
    return {"logged_in": False}


@app.post("/api/password-reset/request")
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
        from urllib.parse import urlparse
        parsed = urlparse(referer)
        if parsed.netloc:
            link = f"{parsed.scheme}://{parsed.netloc}/recuperar-senha?token={token}"
        else:
            link = f"{request.url.scheme}://{request.url.netloc}/recuperar-senha?token={token}"
    else:
        link = f"{request.url.scheme}://{request.url.netloc}/recuperar-senha?token={token}"

    subject = "Recuperação de Senha - Plataforma de Triagem SXF"
    
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
                <a href="{link}" style="display: inline-block; padding: 12px 30px; background-color: #68B2A0; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    Redefinir Senha
                </a>
            </div>
            
            <p style="font-size: 13px; color: #666;">Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:</p>
            <p style="font-size: 12px; color: #2C6975; word-break: break-all; background-color: #E0ECDE; padding: 10px; border-radius: 4px;">{link}</p>
            
            <p style="margin-top: 30px;">Se você não solicitou essa redefinição, por favor ignore este e-mail. Sua senha permanecerá segura.</p>
        </div>
        <div style="border-top: 1px solid #E0ECDE; padding: 15px; text-align: center; color: #777777; font-size: 12px;">
            <p style="margin: 0;">Instituto Buko Kaesemodel</p>
            <p style="margin: 5px 0 0 0;">Este é um e-mail automático, por favor não responda.</p>
        </div>
    </div>
    """
    
    text_content = (
        f"Olá, {user.nome},\n\n"
        f"Recebemos uma solicitação para redefinir a senha da sua conta na Plataforma de Triagem Síndrome do X Frágil.\n\n"
        f"Para redefinir sua senha, acesse o link abaixo (válido por 1 hora):\n"
        f"{link}\n\n"
        f"Se você não solicitou essa redefinição, ignore este e-mail.\n\n"
        f"Instituto Buko Kaesemodel"
    )

    background_tasks.add_task(enviar_email_smtp, user.email, subject, html_content, text_content)
    
    return {"success": True}


@app.post("/api/password-reset/reset")
async def api_password_reset_reset(request: Request, db=Depends(get_db)):
    body = await request.json()
    token = body.get("token")
    nova_senha = body.get("senha")
    
    user = db.query(Usuario).filter(
        Usuario.token_recuperacao == token,
        Usuario.token_expiracao > datetime.now()
    ).first()
    
    if not user:
        return {"success": False, "error": "Token inválido ou expirado"}
    
    user.senha = hash_senha(nova_senha)
    user.token_recuperacao = None
    user.token_expiracao = None
    db.commit()
    
    return {"success": True}


@app.get("/api/sintomas")
async def api_sintomas(db=Depends(get_db)):
    return [
        {
            "id": s.id,
            "nome": s.nome,
            "peso_masculino": float(s.peso_masculino) if s.peso_masculino else 0,
            "peso_feminino": float(s.peso_feminino) if s.peso_feminino else 0,
        }
        for s in db.query(Sintoma).all()
    ]


@app.get("/api/limiares")
async def api_limiares(db=Depends(get_db)):
    return {l.sexo: float(l.valor) for l in db.query(Limiar).all()}


@app.post("/api/paciente/buscar")
async def api_buscar_paciente(request: Request, db=Depends(get_db), _=Depends(require_auth)):
    body = await request.json()
    cpf_limpo = body["cpf"].replace(".", "").replace("-", "")
    paciente = db.query(Paciente).filter(Paciente.cpf == cpf_limpo).first()
    if not paciente:
        return {"found": False}
    is_admin = request.session.get("tipo") == "Administrador"
    is_owner = paciente.id_medico_responsavel == request.session.get("id_usuario")
    if is_admin or is_owner:
        return {
            "found": True,
            "paciente": {
                "id": paciente.id,
                "nome": paciente.nome,
                "cpf": paciente.cpf,
                "sexo": paciente.sexo,
                "data_nascimento": str(paciente.data_nascimento),
                "telefone": paciente.telefone,
                "email": paciente.email,
            },
        }
    medico = db.query(Medico).filter(Medico.id == paciente.id_medico_responsavel).first()
    return {"found": True, "sem_acesso": True, "medico_nome": medico.usuario.nome if medico else "outro médico"}


@app.post("/api/paciente/cadastrar")
async def api_cadastrar_paciente(request: Request, db=Depends(get_db), _=Depends(require_auth)):
    body = await request.json()
    medico = db.query(Medico).filter(Medico.id == request.session.get("id_usuario")).first()
    if not medico and request.session.get("tipo") != "Administrador":
        raise HTTPException(status_code=400, detail="Médico não encontrado")
    cpf_limpo = body["cpf"].replace(".", "").replace("-", "")
    novo = Paciente(
        id_medico_responsavel=medico.id if medico else 1,
        cpf=cpf_limpo,
        nome=body["nome"],
        sexo=body["sexo"],
        data_nascimento=datetime.strptime(body["data_nascimento"], "%Y-%m-%d").date(),
        telefone=body["telefone"],
        email=body["email"],
    )
    db.add(novo)
    db.commit()
    return {"success": True, "id": novo.id}


@app.get("/api/pacientes")
async def api_listar_pacientes(request: Request, db=Depends(get_db), _=Depends(require_auth)):
    if request.session.get("tipo") == "Administrador":
        pacientes = db.query(Paciente).all()
    else:
        pacientes = db.query(Paciente).filter(
            Paciente.id_medico_responsavel == request.session.get("id_usuario")
        ).all()
    return [
        {
            "id": p.id,
            "nome": p.nome,
            "cpf": p.cpf,
            "sexo": p.sexo,
            "data_nascimento": str(p.data_nascimento),
            "telefone": p.telefone,
            "email": p.email,
        }
        for p in pacientes
    ]


@app.post("/api/triagem/calcular")
async def api_triagem(request: Request, db=Depends(get_db), _=Depends(require_auth)):
    body = await request.json()
    paciente = db.query(Paciente).filter(Paciente.id == body["paciente_id"]).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    medico = db.query(Medico).filter(Medico.id == request.session.get("id_usuario")).first()
    if not medico:
        medico = db.query(Medico).first()

    score = calcular_score(body["sintomas"], paciente.sexo, db)
    limiar = get_limiar(db, paciente.sexo)
    atingiu = score >= limiar
    recomendacao = "ENCAMINHAR para teste genético FMR1" if atingiu else "MANTER em observação clínica"

    triagem = Triagem(
        id_medico=medico.id,
        id_paciente=paciente.id,
        nome_responsavel=body.get("nome_responsavel"),
        grau_responsavel=body.get("grau_responsavel"),
        observacoes=body.get("observacoes", ""),
    )
    db.add(triagem)
    db.flush()

    for s in db.query(Sintoma).all():
        db.add(TriagemSintoma(
            id_sintoma=s.id,
            id_triagem=triagem.id,
            presente=body["sintomas"].get(str(s.id), False),
        ))

    resultado = Resultado(
        id_triagem=triagem.id,
        limiar=limiar,
        score_total=score,
        atingiu_limiar=atingiu,
        justificativa=recomendacao,
    )
    db.add(resultado)
    db.flush()

    notif = Notificacao(id_resultado=resultado.id, destinatario=paciente.email)
    db.add(notif)
    db.commit()

    if enviar_email(paciente.email, paciente.nome, score, recomendacao, limiar):
        notif.enviado_em = datetime.now()
        db.commit()

    return {
        "score": score,
        "limiar": limiar,
        "atingiu_limiar": atingiu,
        "recomendacao": recomendacao,
        "triagem_id": triagem.id,
    }


@app.get("/api/triagem/imprimir/{triagem_id}")
async def api_imprimir(triagem_id: int, db=Depends(get_db), _=Depends(require_auth)):
    resultado = db.query(Resultado).filter(Resultado.id_triagem == triagem_id).first()
    triagem = db.query(Triagem).filter(Triagem.id == triagem_id).first()
    paciente = triagem.paciente
    medico_user = db.query(Usuario).filter(Usuario.id == triagem.id_medico).first()
    pdf = gerar_pdf(
        paciente.nome,
        paciente.data_nascimento.strftime("%d/%m/%Y"),
        paciente.sexo,
        float(resultado.score_total),
        resultado.justificativa,
        medico_user.nome if medico_user else "Médico",
        triagem.observacoes,
        float(resultado.limiar),
    )
    filename = f"relatorio_{paciente.nome.replace(' ', '_')}.pdf"
    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.put("/api/triagem/{triagem_id}")
async def api_editar_triagem(triagem_id: int, request: Request, db=Depends(get_db), _=Depends(require_auth)):
    body = await request.json()
    triagem = db.query(Triagem).filter(Triagem.id == triagem_id).first()
    if not triagem:
        raise HTTPException(status_code=404, detail="Consulta não encontrada")

    is_admin = request.session.get("tipo") == "Administrador"
    is_owner = triagem.id_medico == request.session.get("id_usuario")
    if not (is_admin or is_owner):
        raise HTTPException(status_code=403, detail="Sem permissão para editar esta consulta")

    if body.get("data_consulta"):
        try:
            triagem.realizada_em = datetime.strptime(body["data_consulta"], "%Y-%m-%d")
        except ValueError:
            pass

    triagem.observacoes = body.get("observacoes", triagem.observacoes)
    triagem.nome_responsavel = body.get("nome_responsavel", triagem.nome_responsavel)
    triagem.grau_responsavel = body.get("grau_responsavel", triagem.grau_responsavel)

    db.commit()
    return {"success": True, "triagem_id": triagem.id}


@app.get("/api/historico/{paciente_id}")
async def api_historico(paciente_id: int, db=Depends(get_db), _=Depends(require_auth)):
    triagens = db.query(Triagem).filter(Triagem.id_paciente == paciente_id).all()
    result = []
    for t in triagens:
        resultado = db.query(Resultado).filter(Resultado.id_triagem == t.id).first()
        sintomas_presentes = (
            db.query(Sintoma.nome)
            .join(TriagemSintoma, Sintoma.id == TriagemSintoma.id_sintoma)
            .filter(TriagemSintoma.id_triagem == t.id, TriagemSintoma.presente == True)
            .all()
        )
        medico_user = db.query(Usuario).filter(Usuario.id == t.id_medico).first()
        result.append({
            "id": t.id,
            "data": t.realizada_em.strftime("%d/%m/%Y %H:%M"),
            "medico": medico_user.nome if medico_user else "Desconhecido",
            "score": float(resultado.score_total) if resultado else 0,
            "recomendacao": resultado.justificativa if resultado else "",
            "observacoes": t.observacoes,
            "sintomas": [s.nome for s in sintomas_presentes],
        })
    return result


@app.get("/api/relatorios")
async def api_relatorios(request: Request, db=Depends(get_db), _=Depends(require_auth)):
    is_admin = request.session.get("tipo") == "Administrador"
    if is_admin:
        resultados = db.query(Resultado).all()
    else:
        # Médicos veem apenas as triagens que eles realizaram
        resultados = db.query(Resultado).join(Triagem).filter(Triagem.id_medico == request.session.get("id_usuario")).all()
    
    data = []
    for r in resultados:
        triagem = r.triagem
        paciente = triagem.paciente
        medico_user = db.query(Usuario).filter(Usuario.id == triagem.id_medico).first()
        data.append({
            "paciente": paciente.nome,
            "sexo": paciente.sexo,
            "data": r.gerado_em.strftime("%d/%m/%Y"),
            "score": float(r.score_total),
            "recomendacao": r.justificativa,
            "medico": medico_user.nome if medico_user else "Desconhecido",
            "atingiu_limiar": r.atingiu_limiar,
        })
    total = len(resultados)
    encaminhados = sum(1 for r in resultados if r.atingiu_limiar)
    media = sum(float(r.score_total) for r in resultados) / total if total > 0 else 0
    return {"relatorios": data, "total": total, "encaminhados": encaminhados, "media_score": round(media, 3)}


@app.get("/api/usuarios")
async def api_usuarios(db=Depends(get_db), _=Depends(require_admin)):
    return [
        {
            "id": u.id,
            "nome": u.nome,
            "cpf": u.cpf,
            "telefone": u.telefone,
            "email": u.email,
            "tipo": u.tipo,
            "ativo": u.ativo,
        }
        for u in db.query(Usuario).all()
    ]


@app.post("/api/usuario")
async def api_criar_usuario(request: Request, db=Depends(get_db), _=Depends(require_admin)):
    body = await request.json()
    cpf_limpo = body["cpf"].replace(".", "").replace("-", "")
    novo = Usuario(
        nome=body["nome"],
        cpf=cpf_limpo,
        senha=hash_senha(body["senha"]),
        ativo=True,
        telefone=body["telefone"],
        email=body["email"],
        tipo=body["tipo"],
    )
    db.add(novo)
    db.flush()
    if body["tipo"] == "Médico" and body.get("crm"):
        db.add(Medico(id=novo.id, crm=body["crm"]))
    db.commit()
    return {"success": True, "id": novo.id}


@app.put("/api/usuario/{id}")
async def api_atualizar_usuario(id: int, request: Request, db=Depends(get_db), _=Depends(require_admin)):
    body = await request.json()
    user = db.query(Usuario).filter(Usuario.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    user.nome = body["nome"]
    user.email = body["email"]
    user.cpf = body["cpf"].replace(".", "").replace("-", "")
    user.telefone = body["telefone"].replace("(", "").replace(")", "").replace(" ", "").replace("-", "")
    user.tipo = body["tipo"]
    
    if body.get("senha"):
        user.senha = hash_senha(body["senha"])
        
    if user.tipo == "Médico" and body.get("crm"):
        medico = db.query(Medico).filter(Medico.id == id).first()
        if medico:
            medico.crm = body["crm"]
        else:
            db.add(Medico(id=user.id, crm=body["crm"]))
    
    db.commit()
    return {"success": True}


@app.put("/api/paciente/{id}")
async def api_atualizar_paciente(id: int, request: Request, db=Depends(get_db), _=Depends(require_auth)):
    body = await request.json()
    paciente = db.query(Paciente).filter(Paciente.id == id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    # Check permission (only owner or admin)
    is_admin = request.session.get("tipo") == "Administrador"
    if not is_admin and paciente.id_medico_responsavel != request.session.get("id_usuario"):
        raise HTTPException(status_code=403, detail="Sem permissão para editar este paciente")

    paciente.nome = body["nome"]
    paciente.cpf = body["cpf"].replace(".", "").replace("-", "")
    paciente.sexo = body["sexo"]
    paciente.data_nascimento = datetime.strptime(body["data_nascimento"], "%Y-%m-%d").date()
    paciente.telefone = body["telefone"].replace("(", "").replace(")", "").replace(" ", "").replace("-", "")
    paciente.email = body["email"]
    
    db.commit()
    return {"success": True}


@app.delete("/api/usuario/{id}")
async def api_excluir_usuario(id: int, db=Depends(get_db), _=Depends(require_admin)):
    user = db.query(Usuario).filter(Usuario.id == id).first()
    if user:
        user.ativo = False
        db.commit()
    return {"success": True}


@app.post("/api/paciente/trocar_medico")
async def api_trocar_medico(request: Request, db=Depends(get_db), _=Depends(require_admin)):
    body = await request.json()
    db.query(Paciente).filter(Paciente.id == body["paciente_id"]).update(
        {"id_medico_responsavel": body["novo_medico_id"]}
    )
    db.commit()
    return {"success": True}


@app.get("/api/medicos")
async def api_medicos(db=Depends(get_db)):
    medicos = db.query(Medico).join(Usuario).filter(Usuario.ativo == True).all()
    return [
        {
            "id": m.id, 
            "nome": m.usuario.nome, 
            "crm": m.crm,
            "email": m.usuario.email,
            "cpf": m.usuario.cpf,
            "telefone": m.usuario.telefone,
            "tipo": m.usuario.tipo
        }
        for m in medicos
    ]


# ── Static files / SPA ────────────────────────────────────────────────────────
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

handler = Mangum(app)
