import os
from datetime import datetime
from hashlib import sha256
from io import BytesIO
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Date, DateTime, Text, Enum as SQLEnum, ForeignKey, DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from mangum import Mangum

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "sxf_secret"), session_cookie="sxf_session", max_age=28800)


DB_HOST = os.getenv("DB_HOST", "database")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "sxf_triagem_db")
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Usuario(Base):
    __tablename__ = "usuario"
    id = Column(Integer, primary_key=True)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False)
    senha = Column(String(255), nullable=False)
    ativo = Column(Boolean, default=True)
    telefone = Column(String(24), nullable=False)
    email = Column(String(150), nullable=False)
    tipo = Column(SQLEnum('Medico', 'Administrador'), nullable=False)
    criado_em = Column(DateTime, default=datetime.now)

class Medico(Base):
    __tablename__ = "medico"
    id = Column(Integer, ForeignKey('usuario.id'), primary_key=True)
    crm = Column(String(13), unique=True, nullable=False)
    usuario = relationship("Usuario")

class Paciente(Base):
    __tablename__ = "paciente"
    id = Column(Integer, primary_key=True)
    id_medico_que_cadastrou = Column(Integer, ForeignKey('medico.id'), nullable=False)
    nome = Column(String(150), nullable=False)
    sexo = Column(SQLEnum('Feminino', 'Masculino'), nullable=False)
    data_nascimento = Column(Date, nullable=False)
    telefone = Column(String(24), nullable=False)
    email = Column(String(150), nullable=False)
    criado_em = Column(DateTime, default=datetime.now)
    medico = relationship("Medico")

class Sintoma(Base):
    __tablename__ = "sintomas"
    id = Column(Integer, primary_key=True)
    nome = Column(String(135), nullable=False)
    peso_masculino = Column(DECIMAL(3,2))
    peso_feminino = Column(DECIMAL(3,2))

class Limiar(Base):
    __tablename__ = "limiar"
    id = Column(Integer, primary_key=True)
    sexo = Column(SQLEnum('Feminino', 'Masculino'), nullable=False)
    valor = Column(DECIMAL(3,2), nullable=False)

class Triagem(Base):
    __tablename__ = "triagem"
    id = Column(Integer, primary_key=True)
    id_medico = Column(Integer, ForeignKey('medico.id'), nullable=False)
    id_paciente = Column(Integer, ForeignKey('paciente.id'), nullable=False)
    nome_responsavel = Column(String(100))
    grau_responsavel = Column(String(100))
    observacoes = Column(Text)
    realizada_em = Column(DateTime, default=datetime.now)
    medico = relationship("Medico")
    paciente = relationship("Paciente")

class TriagemSintoma(Base):
    __tablename__ = "triagem_sintoma"
    id_sintoma = Column(Integer, ForeignKey('sintomas.id'), primary_key=True)
    id_triagem = Column(Integer, ForeignKey('triagem.id'), primary_key=True)
    presente = Column(Boolean, nullable=False)

class Resultado(Base):
    __tablename__ = "resultado"
    id = Column(Integer, primary_key=True)
    id_triagem = Column(Integer, ForeignKey('triagem.id'), nullable=False)
    limiar = Column(DECIMAL(3,2), nullable=False)
    score_total = Column(DECIMAL(3,2), nullable=False)
    atingiu_limiar = Column(Boolean, nullable=False)
    justificativa = Column(String(100))
    gerado_em = Column(DateTime, default=datetime.now)
    triagem = relationship("Triagem")

class Notificacao(Base):
    __tablename__ = "notificacao"
    id = Column(Integer, primary_key=True)
    id_resultado = Column(Integer, ForeignKey('resultado.id'), nullable=False)
    destinatario = Column(String(150), nullable=False)
    enviado_em = Column(DateTime)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_senha(senha: str) -> str:
    return sha256(senha.encode()).hexdigest()

def get_limiar(db, sexo: str) -> float:
    limiar = db.query(Limiar).filter(Limiar.sexo == sexo).first()
    if limiar:
        return float(limiar.valor)
    return 0.56 if sexo == 'Masculino' else 0.55

def get_sintomas_com_pesos(db, sexo: str):
    sintomas = db.query(Sintoma).all()
    resultado = []
    for s in sintomas:
        peso = float(s.peso_masculino) if sexo == 'Masculino' else float(s.peso_feminino) if s.peso_feminino else 0
        resultado.append({"id": s.id, "nome": s.nome, "peso": peso})
    return resultado

def calcular_score(sintomas_marcados: dict, sexo: str, db) -> float:
    sintomas_db = db.query(Sintoma).all()
    score = 0.0
    for s in sintomas_db:
        peso = float(s.peso_masculino) if sexo == 'Masculino' else float(s.peso_feminino) if s.peso_feminino else 0
        if sintomas_marcados.get(str(s.id)):
            score += peso
    return round(score, 3)

def enviar_email(destino, nome, score, recomendacao, limiar):
    if not destino:
        return False
    try:
        msg = MIMEMultipart()
        msg['Subject'] = f"Resultado Triagem SXF - {nome}"
        msg['From'] = "triagem@ibk.org"
        msg['To'] = destino
        corpo = f"""Paciente: {nome}
Score: {score:.3f}
Limiar: {limiar}
Recomendação: {recomendacao}

Instituto Buko Kaesemodel"""
        msg.attach(MIMEText(corpo, 'plain'))
        print(f"[EMAIL] {destino} - Score:{score}")
        return True
    except Exception as e:
        print(f"Erro email: {e}")
        return False

def gerar_pdf(nome, data_nasc, sexo, score, recomendacao, medico, obs, limiar):
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
    pdf.setFillColorRGB(1,0,0) if "ENCAMINHAR" in recomendacao else pdf.setFillColorRGB(0,0.5,0)
    pdf.drawString(50, 590, recomendacao)
    pdf.setFillColorRGB(0,0,0)
    pdf.setFont("Helvetica", 10)
    pdf.drawString(50, 560, f"Observações: {obs if obs else 'Nenhuma'}")
    pdf.save()
    buffer.seek(0)
    return buffer


@app.post("/api/login")
async def api_login(request: Request, db=Depends(get_db)):
    body = await request.json()
    senha_hash = hash_senha(body['senha'])
    user = db.query(Usuario).filter(
        Usuario.cpf == body['login'], 
        Usuario.senha == senha_hash, 
        Usuario.ativo == True
    ).first()
    if not user:
        user = db.query(Usuario).filter(
            Usuario.email == body['login'], 
            Usuario.senha == senha_hash, 
            Usuario.ativo == True
        ).first()
    if user:
        request.session.update({
            "user_logged_in": True, 
            "id_usuario": user.id,
            "nome_usuario": user.nome, 
            "tipo": user.tipo
        })
        return {"success": True, "tipo": user.tipo, "nome": user.nome}
    return {"success": False, "error": "Usuário ou senha inválidos"}

@app.post("/api/logout")
async def api_logout(request: Request):
    request.session.clear()
    return {"success": True}

@app.get("/api/check")
async def api_check(request: Request):
    if request.session.get("user_logged_in"):
        return {"logged_in": True, "tipo": request.session.get("tipo"), "nome": request.session.get("nome_usuario")}
    return {"logged_in": False}

@app.get("/api/sintomas")
async def api_sintomas(db=Depends(get_db)):
    sintomas = db.query(Sintoma).all()
    return [{"id": s.id, "nome": s.nome, "peso_masculino": float(s.peso_masculino) if s.peso_masculino else 0, "peso_feminino": float(s.peso_feminino) if s.peso_feminino else 0} for s in sintomas]

@app.get("/api/limiares")
async def api_limiares(db=Depends(get_db)):
    limiares = db.query(Limiar).all()
    return {l.sexo: float(l.valor) for l in limiares}

@app.post("/api/paciente/buscar")
async def api_buscar_paciente(request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in"):
        raise HTTPException(status_code=401, detail="Não autorizado")
    body = await request.json()
    cpf_limpo = body['cpf'].replace(".", "").replace("-", "")
    paciente = db.query(Paciente).filter(Paciente.cpf == cpf_limpo).first()
    if not paciente:
        return {"found": False}
    if request.session.get("tipo") == "Administrador" or paciente.id_medico_que_cadastrou == request.session.get("id_usuario"):
        return {
            "found": True, 
            "paciente": {
                "id": paciente.id, 
                "nome": paciente.nome, 
                "cpf": paciente.cpf, 
                "sexo": paciente.sexo, 
                "data_nascimento": str(paciente.data_nascimento), 
                "telefone": paciente.telefone, 
                "email": paciente.email
            }
        }
    medico = db.query(Medico).filter(Medico.id == paciente.id_medico_que_cadastrou).first()
    return {"found": True, "sem_acesso": True, "medico_nome": medico.usuario.nome if medico else "outro médico"}

@app.post("/api/paciente/cadastrar")
async def api_cadastrar_paciente(request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in"):
        raise HTTPException(status_code=401, detail="Não autorizado")
    body = await request.json()
    medico = db.query(Medico).filter(Medico.id == request.session.get("id_usuario")).first()
    if not medico and request.session.get("tipo") != "Administrador":
        raise HTTPException(status_code=400, detail="Médico não encontrado")
    cpf_limpo = body['cpf'].replace(".", "").replace("-", "")
    novo = Paciente(
        id_medico_que_cadastrou=medico.id if medico else 1,
        cpf=cpf_limpo, 
        nome=body['nome'], 
        sexo=body['sexo'],
        data_nascimento=datetime.strptime(body['data_nascimento'], "%Y-%m-%d").date(),
        telefone=body['telefone'], 
        email=body['email']
    )
    db.add(novo)
    db.commit()
    return {"success": True, "id": novo.id}

@app.get("/api/pacientes")
async def api_listar_pacientes(request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in"):
        raise HTTPException(status_code=401, detail="Não autorizado")
    if request.session.get("tipo") == "Administrador":
        pacientes = db.query(Paciente).all()
    else:
        pacientes = db.query(Paciente).filter(Paciente.id_medico_que_cadastrou == request.session.get("id_usuario")).all()
    return [{"id": p.id, "nome": p.nome, "cpf": p.cpf, "sexo": p.sexo, "data_nascimento": str(p.data_nascimento), "telefone": p.telefone, "email": p.email} for p in pacientes]

@app.post("/api/triagem/calcular")
async def api_triagem(request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in"):
        raise HTTPException(status_code=401, detail="Não autorizado")
    body = await request.json()
    paciente = db.query(Paciente).filter(Paciente.id == body['paciente_id']).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    
    medico = db.query(Medico).filter(Medico.id == request.session.get("id_usuario")).first()
    if not medico:
        medico = db.query(Medico).first()
    

    score = calcular_score(body['sintomas'], paciente.sexo, db)
    
 
    limiar = get_limiar(db, paciente.sexo)
    atingiu = score >= limiar
    recomendacao = "ENCAMINHAR para teste genético FMR1" if atingiu else "MANTER em observação clínica"
    

    triagem = Triagem(
        id_medico=medico.id, 
        id_paciente=paciente.id, 
        nome_responsavel=body.get('nome_responsavel'), 
        grau_responsavel=body.get('grau_responsavel'), 
        observacoes=body.get('observacoes', '')
    )
    db.add(triagem)
    db.flush()
    

    sintomas_db = db.query(Sintoma).all()
    for s in sintomas_db:
        db.add(TriagemSintoma(
            id_sintoma=s.id, 
            id_triagem=triagem.id, 
            presente=body['sintomas'].get(str(s.id), False)
        ))
    

    resultado = Resultado(
        id_triagem=triagem.id, 
        limiar=limiar, 
        score_total=score, 
        atingiu_limiar=atingiu, 
        justificativa=recomendacao
    )
    db.add(resultado)
    db.flush()
    

    notif = Notificacao(id_resultado=resultado.id, destinatario=paciente.email)
    db.add(notif)
    db.commit()
    

    enviado = enviar_email(paciente.email, paciente.nome, score, recomendacao, limiar)
    if enviado:
        notif.enviado_em = datetime.now()
        db.commit()
    
    return {"score": score, "limiar": limiar, "atingiu_limiar": atingiu, "recomendacao": recomendacao, "triagem_id": triagem.id}

@app.post("/api/triagem/imprimir/{triagem_id}")
async def api_imprimir(triagem_id: int, request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in"):
        raise HTTPException(status_code=401, detail="Não autorizado")
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
        float(resultado.limiar)
    )
    return StreamingResponse(pdf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=relatorio_{paciente.nome.replace(' ', '_')}.pdf"})

@app.get("/api/historico/{paciente_id}")
async def api_historico(paciente_id: int, request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in"):
        raise HTTPException(status_code=401, detail="Não autorizado")
    triagens = db.query(Triagem).filter(Triagem.id_paciente == paciente_id).all()
    result = []
    for t in triagens:
        resultado = db.query(Resultado).filter(Resultado.id_triagem == t.id).first()
        sintomas = db.query(TriagemSintoma).filter(
            TriagemSintoma.id_triagem == t.id, 
            TriagemSintoma.presente == True
        ).all()
        sintomas_nomes = []
        for s in sintomas:
            nome = db.query(Sintoma).filter(Sintoma.id == s.id_sintoma).first()
            if nome:
                sintomas_nomes.append(nome.nome)
        medico_user = db.query(Usuario).filter(Usuario.id == t.id_medico).first()
        result.append({
            "id": t.id, 
            "data": t.realizada_em.strftime("%d/%m/%Y %H:%M"), 
            "medico": medico_user.nome if medico_user else "Desconhecido", 
            "score": float(resultado.score_total) if resultado else 0, 
            "recomendacao": resultado.justificativa if resultado else "", 
            "observacoes": t.observacoes, 
            "sintomas": sintomas_nomes
        })
    return result

@app.get("/api/relatorios")
async def api_relatorios(request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in") or request.session.get("tipo") != "Administrador":
        raise HTTPException(status_code=401, detail="Não autorizado")
    resultados = db.query(Resultado).all()
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
            "atingiu_limiar": r.atingiu_limiar
        })
    total = len(resultados)
    encaminhados = sum(1 for r in resultados if r.atingiu_limiar)
    media = sum(float(r.score_total) for r in resultados) / total if total > 0 else 0
    return {"relatorios": data, "total": total, "encaminhados": encaminhados, "media_score": round(media, 3)}

@app.get("/api/usuarios")
async def api_usuarios(request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in") or request.session.get("tipo") != "Administrador":
        raise HTTPException(status_code=401, detail="Não autorizado")
    usuarios = db.query(Usuario).all()
    return [{"id": u.id, "nome": u.nome, "cpf": u.cpf, "telefone": u.telefone, "email": u.email, "tipo": u.tipo, "ativo": u.ativo} for u in usuarios]

@app.post("/api/usuario")
async def api_criar_usuario(request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in") or request.session.get("tipo") != "Administrador":
        raise HTTPException(status_code=401, detail="Não autorizado")
    body = await request.json()
    cpf_limpo = body['cpf'].replace(".", "").replace("-", "")
    senha_hash = hash_senha(body['senha'])
    novo = Usuario(
        nome=body['nome'], 
        cpf=cpf_limpo, 
        senha=senha_hash, 
        ativo=True, 
        telefone=body['telefone'], 
        email=body['email'], 
        tipo=body['tipo']
    )
    db.add(novo)
    db.flush()
    if body['tipo'] == "Medico" and body.get('crm'):
        db.add(Medico(id=novo.id, crm=body['crm']))
    db.commit()
    return {"success": True, "id": novo.id}

@app.delete("/api/usuario/{id}")
async def api_excluir_usuario(id: int, request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in") or request.session.get("tipo") != "Administrador":
        raise HTTPException(status_code=401, detail="Não autorizado")
    user = db.query(Usuario).filter(Usuario.id == id).first()
    if user:
        user.ativo = False
        db.commit()
    return {"success": True}

@app.post("/api/paciente/trocar_medico")
async def api_trocar_medico(request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in") or request.session.get("tipo") != "Administrador":
        raise HTTPException(status_code=401, detail="Não autorizado")
    body = await request.json()
    db.query(Paciente).filter(Paciente.id == body['paciente_id']).update({"id_medico_que_cadastrou": body['novo_medico_id']})
    db.commit()
    return {"success": True}

@app.get("/api/medicos")
async def api_medicos(db=Depends(get_db)):
    medicos = db.query(Medico).all()
    result = []
    for m in medicos:
        user = db.query(Usuario).filter(Usuario.id == m.id).first()
        if user:
            result.append({"id": m.id, "nome": user.nome, "crm": m.crm})
    return result


if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith("api/") or full_path.startswith("assets/"):
            raise HTTPException(status_code=404)
        file_path = f"frontend/dist/{full_path}"
        if os.path.exists(file_path) and not os.path.isdir(file_path):
            return FileResponse(file_path)
        return FileResponse("frontend/dist/index.html")
else:
    print("frontend/dist não encontrado - Rodando sem React")

Mangum(app)