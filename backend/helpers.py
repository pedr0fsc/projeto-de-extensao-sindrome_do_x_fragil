import os
import re
import smtplib
import unicodedata
from hashlib import sha256
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi import Request, HTTPException
from .schema import Sintoma, Limiar, Instituicao

def to_snake_case(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '_', text)

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

def get_default_instituicao(db):
    return db.query(Instituicao).order_by(Instituicao.id).first()

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
            </table>

            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2C6975; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Recomendação Clínica:</p>
                <p style="margin: 5px 0 0;">{recomendacao}</p>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Este e-mail é informativo. Procure sempre orientação médica especializada para o acompanhamento completo.
            </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee;">
            Plataforma de Triagem SXF © {datetime.now().year}
        </div>
    </div>
    """
    
    text_content = f"Resultado da Triagem SXF - Paciente: {nome}, Score: {score:.3f}, Limiar: {limiar}. Recomendação: {recomendacao}"
    
    return enviar_email_smtp(destino, "Resultado da Triagem SXF", html_content, text_content)

def require_auth(request: Request):
    if not request.session.get("user_logged_in"):
        raise HTTPException(status_code=401, detail="Não autorizado")

def require_admin(request: Request):
    if not request.session.get("user_logged_in") or request.session.get("tipo") != "Administrador":
        raise HTTPException(status_code=401, detail="Não autorizado")
