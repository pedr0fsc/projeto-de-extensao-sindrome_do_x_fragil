import pymysql
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from mangum import Mangum
from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from datetime import date, datetime
from hashlib import md5
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO

app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key="x_fragil_secret", session_cookie="sxf_session", max_age=28800)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", ""),
    "cursorclass": pymysql.cursors.DictCursor
}


SINTOMAS = [
    "deficiencia_intelectual", "face_alongada_orelhas_abano", "macroorquidismo",
    "hipermobilidade_articular", "dificuldades_aprendizagem", "deficit_atencao",
    "movimentos_repetitivos", "atraso_fala", "hiperatividade",
    "evitar_contato_visual", "evitar_contato_fisico", "agressividade"
]

PESOS = {
    "M": [0.32, 0.15, 0.20, 0.08, 0.18, 0.10, 0.12, 0.18, 0.10, 0.10, 0.08, 0.07],
    "F": [0.20, 0.10, 0.00, 0.12, 0.28, 0.15, 0.12, 0.15, 0.12, 0.12, 0.10, 0.08]
}
LIMIAR = {"M": 0.56, "F": 0.55}

def get_db(): return pymysql.connect(**DB_CONFIG)

def calcular_score(sintomas_marcados, sexo):
    score = 0.0
    pesos = PESOS[sexo]
    for i, sintoma in enumerate(SINTOMAS):
        if sintomas_marcados.get(sintoma) == "on":
            score += pesos[i]
    return round(score, 3)

def enviar_email(destino, nome, score, recomendacao):
    if not destino: return False
    try:
        msg = MIMEMultipart()
        msg['Subject'] = f"Resultado Triagem SXF - {nome}"
        msg['From'] = "triagem@ibk.org"
        msg['To'] = destino
        corpo = f"""Paciente: {nome}
Score: {score:.3f}
Recomendação:

{recomendacao}

Instituto Buko Kaesemodel"""
        msg.attach(MIMEText(corpo, 'plain'))
        print(f"[EMAIL] {destino} - Score:{score}")
        return True
    except Exception as e:
        print(f"Erro email: {e}")
        return False

def gerar_pdf(nome, data_nasc, sexo, score, recomendacao, medico, obs):
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(200, 800, "Relatório Triagem - SXF")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, 750, f"Paciente: {nome}")
    pdf.drawString(50, 730, f"Nascimento: {data_nasc}")
    pdf.drawString(50, 710, f"Sexo: {'Masculino' if sexo=='M' else 'Feminino'}")
    pdf.drawString(50, 690, f"Médico: {medico}")
    pdf.drawString(50, 670, f"Data: {date.today().strftime('%d/%m/%Y')}")
    pdf.line(50, 650, 550, 650)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, 620, f"Score: {score:.3f} (Limiar: {LIMIAR[sexo]})")
    pdf.setFillColorRGB(1,0,0) if "ENCAMINHAR" in recomendacao else pdf.setFillColorRGB(0,0.5,0)
    pdf.drawString(50, 590, recomendacao)
    pdf.setFillColorRGB(0,0,0)
    pdf.setFont("Helvetica", 10)
    pdf.drawString(50, 560, f"Observações: {obs if obs else 'Nenhuma'}")
    pdf.save()
    buffer.seek(0)
    return buffer

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    if request.session.get("user_logged_in"):
        return RedirectResponse(url="/dashboard", status_code=303)
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login")
async def login(request: Request, login: str = Form(...), senha: str = Form(...)):
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT ID_Usuario, Nome, Perfil FROM Usuario WHERE Login=%s AND Senha=MD5(%s)", (login, senha))
            user = cursor.fetchone()
            if user:
                request.session.update({"user_logged_in": True, "id_usuario": user["ID_Usuario"], "nome_usuario": user["Nome"], "perfil": user["Perfil"]})
                return RedirectResponse(url="/dashboard", status_code=303)
            request.session["login_error"] = "Inválido"
            return RedirectResponse(url="/", status_code=303)
    finally: db.close()

@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/", status_code=303)

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    if not request.session.get("user_logged_in"): return RedirectResponse(url="/", status_code=303)
    return templates.TemplateResponse("dashboard.html", {"request": request, "nome_usuario": request.session.get("nome_usuario"), "perfil": request.session.get("perfil")})

@app.get("/pacientes", response_class=HTMLResponse)
async def listar_pacientes(request: Request):
    if not request.session.get("user_logged_in"): return RedirectResponse(url="/", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            if request.session.get("perfil") == "admin":
                cursor.execute("SELECT p.*, u.Nome as Medico_Nome FROM Paciente p LEFT JOIN Usuario u ON p.ID_Medico_Responsavel = u.ID_Usuario ORDER BY p.Nome")
            else:
                cursor.execute("SELECT p.*, u.Nome as Medico_Nome FROM Paciente p LEFT JOIN Usuario u ON p.ID_Medico_Responsavel = u.ID_Usuario WHERE p.ID_Medico_Responsavel = %s ORDER BY p.Nome", (request.session.get("id_usuario"),))
            pacientes = cursor.fetchall()
        return templates.TemplateResponse("pacientes.html", {"request": request, "pacientes": pacientes})
    finally: db.close()

@app.get("/paciente/novo", response_class=HTMLResponse)
async def novo_paciente(request: Request):
    if not request.session.get("user_logged_in"): return RedirectResponse(url="/", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT ID_Usuario, Nome FROM Usuario WHERE Perfil='medico'")
            medicos = cursor.fetchall()
        return templates.TemplateResponse("paciente_form.html", {"request": request, "medicos": medicos})
    finally: db.close()

@app.post("/paciente/salvar")
async def salvar_paciente(request: Request, nome: str = Form(...), data_nasc: str = Form(...), sexo: str = Form(...), email: str = Form(None), telefone: str = Form(None), responsavel: str = Form(None), id_medico: int = Form(...)):
    if not request.session.get("user_logged_in"): return RedirectResponse(url="/", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("INSERT INTO Paciente (Nome, Data_Nasc, Sexo, Email, Telefone, Responsavel, ID_Medico_Responsavel) VALUES (%s,%s,%s,%s,%s,%s,%s)", (nome, data_nasc, sexo, email, telefone, responsavel, id_medico))
            db.commit()
        return RedirectResponse(url="/pacientes", status_code=303)
    finally: db.close()

@app.get("/paciente/editar/{id}")
async def editar_paciente(request: Request, id: int):
    if not request.session.get("user_logged_in"): return RedirectResponse(url="/", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM Paciente WHERE ID_Paciente=%s", (id,))
            paciente = cursor.fetchone()
            cursor.execute("SELECT ID_Usuario, Nome FROM Usuario WHERE Perfil='medico'")
            medicos = cursor.fetchall()
        return templates.TemplateResponse("paciente_form.html", {"request": request, "paciente": paciente, "medicos": medicos})
    finally: db.close()

@app.get("/paciente/trocar_medico/{id}")
async def trocar_medico_form(request: Request, id: int):
    if not request.session.get("user_logged_in") or request.session.get("perfil") != "admin":
        return RedirectResponse(url="/pacientes", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM Paciente WHERE ID_Paciente=%s", (id,))
            paciente = cursor.fetchone()
            cursor.execute("SELECT ID_Usuario, Nome FROM Usuario WHERE Perfil='medico'")
            medicos = cursor.fetchall()
        return templates.TemplateResponse("trocar_medico.html", {"request": request, "paciente": paciente, "medicos": medicos})
    finally: db.close()

@app.post("/paciente/trocar_medico_exe")
async def trocar_medico_exe(request: Request, id_paciente: int = Form(...), novo_medico: int = Form(...)):
    if not request.session.get("user_logged_in") or request.session.get("perfil") != "admin":
        return RedirectResponse(url="/pacientes", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE Paciente SET ID_Medico_Responsavel=%s WHERE ID_Paciente=%s", (novo_medico, id_paciente))
            db.commit()
        return RedirectResponse(url="/pacientes", status_code=303)
    finally: db.close()

@app.get("/triagem/nova/{id_paciente}", response_class=HTMLResponse)
async def nova_triagem(request: Request, id_paciente: int):
    if not request.session.get("user_logged_in"): return RedirectResponse(url="/", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM Paciente WHERE ID_Paciente=%s", (id_paciente,))
            paciente = cursor.fetchone()
        return templates.TemplateResponse("triagem_form.html", {"request": request, "paciente": paciente, "sintomas": SINTOMAS})
    finally: db.close()

@app.post("/triagem/calcular")
async def calcular_triagem(request: Request, id_paciente: int = Form(...), observacao: str = Form("")):
    if not request.session.get("user_logged_in"): return RedirectResponse(url="/", status_code=303)
    form_data = await request.form()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT p.*, u.Nome as Medico_Nome FROM Paciente p JOIN Usuario u ON u.ID_Usuario = p.ID_Medico_Responsavel WHERE p.ID_Paciente=%s", (id_paciente,))
            paciente = cursor.fetchone()
            
            score = calcular_score(form_data, paciente["Sexo"])
            recomendacao = "ENCAMINHAR para teste genético FMR1" if score >= LIMIAR[paciente["Sexo"]] else "MANTER em observação clínica"
            
            cursor.execute("INSERT INTO Triagem (ID_Paciente, ID_Medico, Data_Triagem, Score, Recomendacao, Observacao) VALUES (%s, %s, %s, %s, %s, %s)", (id_paciente, request.session.get("id_usuario"), date.today(), score, recomendacao, observacao))
            id_triagem = cursor.lastrowid
            
            for sintoma in SINTOMAS:
                presente = 1 if form_data.get(sintoma) == "on" else 0
                cursor.execute("INSERT INTO Triagem_Sintoma (ID_Triagem, Sintoma_Nome, Presente) VALUES (%s, %s, %s)", (id_triagem, sintoma, presente))
            
            db.commit()
            
            if paciente.get("Email"):
                enviar_email(paciente["Email"], paciente["Nome"], score, recomendacao)
            
            return templates.TemplateResponse("triagem_resultado.html", {"request": request, "paciente": paciente, "score": score, "limiar": LIMIAR[paciente["Sexo"]], "recomendacao": recomendacao, "observacao": observacao})
    finally: db.close()


@app.post("/triagem/imprimir")
async def imprimir_pdf(request: Request, nome: str = Form(...), data_nasc: str = Form(...), sexo: str = Form(...), score: float = Form(...), recomendacao: str = Form(...), medico: str = Form(...), observacao: str = Form("")):
    pdf = gerar_pdf(nome, data_nasc, sexo, score, recomendacao, medico, observacao)
    return StreamingResponse(pdf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=relatorio_{nome.replace(' ', '_')}.pdf"})


@app.get("/historico/{id_paciente}", response_class=HTMLResponse)
async def historico(request: Request, id_paciente: int):
    if not request.session.get("user_logged_in"): return RedirectResponse(url="/", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM Paciente WHERE ID_Paciente=%s", (id_paciente,))
            paciente = cursor.fetchone()
            
            cursor.execute("""
                SELECT t.*, u.Nome as Medico_Nome,
                    GROUP_CONCAT(CASE WHEN ts.Presente=1 THEN ts.Sintoma_Nome END SEPARATOR ', ') as Sintomas_Presentes,
                    GROUP_CONCAT(CASE WHEN ts.Presente=0 THEN ts.Sintoma_Nome END SEPARATOR ', ') as Sintomas_Ausentes
                FROM Triagem t
                JOIN Usuario u ON t.ID_Medico = u.ID_Usuario
                LEFT JOIN Triagem_Sintoma ts ON t.ID_Triagem = ts.ID_Triagem
                WHERE t.ID_Paciente = %s
                GROUP BY t.ID_Triagem
                ORDER BY t.Data_Triagem DESC
            """, (id_paciente,))
            historico = cursor.fetchall()
        return templates.TemplateResponse("historico.html", {"request": request, "paciente": paciente, "historico": historico})
    finally: db.close()


@app.get("/usuarios", response_class=HTMLResponse)
async def listar_usuarios(request: Request):
    if not request.session.get("user_logged_in") or request.session.get("perfil") != "admin":
        return RedirectResponse(url="/dashboard", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM Usuario ORDER BY Perfil, Nome")
            usuarios = cursor.fetchall()
        return templates.TemplateResponse("usuarios.html", {"request": request, "usuarios": usuarios})
    finally: db.close()

@app.post("/usuario/salvar")
async def salvar_usuario(request: Request, nome: str = Form(...), login: str = Form(...), senha: str = Form(...), perfil: str = Form(...), celular: str = Form(None)):
    if not request.session.get("user_logged_in") or request.session.get("perfil") != "admin":
        return RedirectResponse(url="/dashboard", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("INSERT INTO Usuario (Nome, Login, Senha, Perfil, Celular) VALUES (%s, %s, MD5(%s), %s, %s)", (nome, login, senha, perfil, celular))
            db.commit()
        return RedirectResponse(url="/usuarios", status_code=303)
    finally: db.close()

@app.get("/usuario/excluir/{id}")
async def excluir_usuario(request: Request, id: int):
    if not request.session.get("user_logged_in") or request.session.get("perfil") != "admin":
        return RedirectResponse(url="/dashboard", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM Usuario WHERE ID_Usuario=%s", (id,))
            db.commit()
        return RedirectResponse(url="/usuarios", status_code=303)
    finally: db.close()


@app.get("/relatorios", response_class=HTMLResponse)
async def relatorios(request: Request):
    if not request.session.get("user_logged_in") or request.session.get("perfil") != "admin":
        return RedirectResponse(url="/dashboard", status_code=303)
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT p.Nome, p.Sexo, t.Data_Triagem, t.Score, t.Recomendacao, t.Observacao, u.Nome as Medico,
                    GROUP_CONCAT(CASE WHEN ts.Presente=1 THEN ts.Sintoma_Nome END SEPARATOR ', ') as Sintomas
                FROM Triagem t
                JOIN Paciente p ON t.ID_Paciente = p.ID_Paciente
                JOIN Usuario u ON t.ID_Medico = u.ID_Usuario
                LEFT JOIN Triagem_Sintoma ts ON t.ID_Triagem = ts.ID_Triagem
                GROUP BY t.ID_Triagem
                ORDER BY t.Data_Triagem DESC
            """)
            triagens = cursor.fetchall()
            cursor.execute("SELECT COUNT(*) as total, AVG(Score) as media FROM Triagem")
            stats = cursor.fetchone()
        return templates.TemplateResponse("relatorios.html", {"request": request, "triagens": triagens, "stats": stats})
    finally: db.close()

Mangum(app)