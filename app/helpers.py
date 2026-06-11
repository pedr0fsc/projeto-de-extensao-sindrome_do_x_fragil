import os
import smtplib
from datetime import datetime
from hashlib import sha256
from io import BytesIO
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.models import Sintoma, Limiar, Instituicao, InstitutoMedico, Usuario


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


def get_institutos_medico(db, id_medico):
    rows = db.query(InstitutoMedico).filter(
        InstitutoMedico.id_medico == id_medico,
        InstitutoMedico.vinculo_ativo == True
    ).all()
    return [r.id_instituto for r in rows]


def sincronizar_ativo_medico(db, id_medico):
    tem_vinculo_ativo = db.query(InstitutoMedico).filter(
        InstitutoMedico.id_medico == id_medico,
        InstitutoMedico.vinculo_ativo == True
    ).first()
    db.query(Usuario).filter(Usuario.id == id_medico).update(
        {"ativo": bool(tem_vinculo_ativo)}
    )


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
                <p style="margin: 0; font-size: 14px; color: #555;"><strong>Nota Importante:</strong> Esta triagem clínica não é um diagnóstico definitivo.</p>
            </div>
        </div>
        <div style="border-top: 1px solid #E0ECDE; padding: 15px; text-align: center; color: #777777; font-size: 12px;">
            <p style="margin: 0;">Instituto Buko Kaesemodel</p>
        </div>
    </div>
    """
    text_content = (
        f"Paciente: {nome}\nScore: {score:.3f}\nLimiar: {limiar}\n"
        f"Recomendação: {recomendacao}\n\nInstituto Buko Kaesemodel"
    )
    return enviar_email_smtp(destino, f"Resultado Triagem SXF - {nome}", html_content, text_content)


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
