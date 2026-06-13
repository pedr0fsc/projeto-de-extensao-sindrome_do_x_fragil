import os
import secrets
import smtplib
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from .db import get_db
from .schema import Usuario, Medico, Instituicao, Paciente, Sintoma, Limiar, Triagem, TriagemSintoma, Resultado, Notificacao, FotoPaciente
from .helpers import hash_senha, get_limiar, calcular_score, get_default_instituicao, enviar_email, to_snake_case, require_auth, require_admin, enviar_email_smtp
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from io import BytesIO

router = APIRouter()

def gerar_pdf_relatorio(nome, data_nasc, sexo, score, recomendacao, medico, limiar, cpf, data_triagem, instituicao, responsavel, grau_resp) -> BytesIO:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    
    pdf.setFont("Helvetica-Bold", 16)
    pdf.setFillColorRGB(0.17, 0.41, 0.46) # Cor padrão #2C6975
    pdf.drawString(180, 800, "Relatório de Triagem - Síndrome do X Frágil")
    
    
    pdf.setStrokeColorRGB(0.17, 0.41, 0.46)
    pdf.setLineWidth(1)
    pdf.line(50, 785, 550, 785)
    
    
    pdf.setFont("Helvetica-Bold", 12)
    pdf.setFillColorRGB(0, 0, 0)
    pdf.drawString(50, 760, "Dados do Paciente")
    
    pdf.setFont("Helvetica", 11)
    pdf.drawString(50, 740, f"Nome: {nome}")
    pdf.drawString(50, 720, f"CPF: {cpf}")
    pdf.drawString(50, 700, f"Data de Nascimento: {data_nasc}")
    pdf.drawString(50, 680, f"Sexo: {sexo}")
    
    
    if responsavel and responsavel != "Não informado":
        pdf.drawString(50, 660, f"Responsável: {responsavel} ({grau_resp})")
        y_linha = 640
    else:
        y_linha = 660

    
    pdf.setStrokeColorRGB(0.8, 0.8, 0.8)
    pdf.line(50, y_linha, 550, y_linha)
    
    
    y_clinica = y_linha - 20
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(50, y_clinica, "Dados da Avaliação")
    
    pdf.setFont("Helvetica", 11)
    pdf.drawString(50, y_clinica - 20, f"Médico Responsável: {medico}")
    pdf.drawString(50, y_clinica - 40, f"Instituição: {instituicao or 'Não informada'}")
    pdf.drawString(50, y_clinica - 60, f"Data da Triagem: {data_triagem}")
    
    
    pdf.line(50, y_clinica - 80, 550, y_clinica - 80)
    
    
    y_resultado = y_clinica - 100
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(50, y_resultado, "Conclusão Diagnóstica")
    
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(50, y_resultado - 25, f"Score Obtido: {score:.3f}  (Limiar Clínico: {limiar})")
    
    
    if "ENCAMINHAR" in recomendacao.upper():
        pdf.setFillColorRGB(0.8, 0, 0)
    else:
        pdf.setFillColorRGB(0, 0.5, 0)
        
    pdf.drawString(50, y_resultado - 50, f"Diretriz Clínica: {recomendacao}")
    
    
    pdf.setStrokeColorRGB(0.17, 0.41, 0.46)
    pdf.line(50, 50, 550, 50)
    pdf.setFont("Helvetica", 9)
    pdf.setFillColorRGB(0.5, 0.5, 0.5)
    pdf.drawString(50, 38, "Este documento é um relatório gerado de forma sistêmica com base nos critérios clínicos estabelecidos.")
    pdf.drawString(450, 38, f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    
    pdf.save()
    buffer.seek(0)
    return buffer


@router.get("/api/triagem/imprimir/{triagem_id}")
async def api_imprimir(triagem_id: int, db: Session = Depends(get_db)):
    res_obj = db.query(Resultado).filter(Resultado.id_triagem == triagem_id).first()
    t = db.query(Triagem).filter(Triagem.id == triagem_id).first()
    
    if not t or not res_obj:
        raise HTTPException(status_code=404, detail="Triagem ou resultado não encontrado.")
    
    
    pdf = gerar_pdf_relatorio(
        nome=t.paciente.nome,
        data_nasc=t.paciente.data_nascimento.strftime("%d/%m/%Y"),
        sexo=t.paciente.sexo,
        score=float(res_obj.score_total),
        recomendacao=res_obj.justificativa,
        medico=t.medico.usuario.nome,
        limiar=float(res_obj.limiar),
        cpf=t.paciente.cpf,
        data_triagem=t.realizada_em.strftime("%d/%m/%Y %H:%M"),
        instituicao=t.paciente.instituicao.nome_fantasia if t.paciente.instituicao else None,
        responsavel=t.nome_responsavel,
        grau_resp=t.grau_responsavel
    )
    
    return StreamingResponse(
        pdf, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"inline; filename=relatorio_{t.paciente.nome.replace(' ', '_')}.pdf"}
    )


@router.get("/api/historico/imprimir/{triagem_id}")
async def api_imprimir_historico(triagem_id: int, db: Session = Depends(get_db)):
    return await api_imprimir(triagem_id, db)

@router.post("/api/login")
async def api_login(request: Request, db: Session = Depends(get_db)):
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

@router.post("/api/logout")
async def api_logout(request: Request):
    request.session.clear()
    return {"success": True}

@router.get("/api/check")
async def api_check(request: Request):
    if request.session.get("user_logged_in"):
        return {"logged_in": True, "tipo": request.session.get("tipo"), "nome": request.session.get("nome_usuario")}
    return {"logged_in": False}

@router.post("/api/password-reset/request")
async def api_password_reset_request(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
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

    link = f"{request.url.scheme}://{request.url.netloc}/recuperar-senha?token={token}"
    subject = "Recuperação de Senha - Plataforma de Triagem SXF"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2C6975; text-align: center;">Plataforma de Triagem SXF</h2>
        <p>Olá, <strong>{user.nome}</strong>,</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha (link válido por 1 hora):</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{link}" style="background-color: #68B2A0; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Redefinir Minha Senha</a>
        </p>
        <p style="font-size: 12px; color: #666; text-align: center;">Se você não solicitou esta alteração, pode ignorar este e-mail com segurança.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999; text-align: center;">Instituto Buko Kaesemodel</p>
    </div>
    """
    text_content = f"Olá, {user.nome}. Recupere sua senha acessando: {link}"

    background_tasks.add_task(enviar_email_smtp, user.email, subject, html_content, text_content)
    return {"success": True}

@router.post("/api/password-reset/reset")
async def api_password_reset_reset(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    token = body.get("token")
    nova_senha = body.get("senha")
    user = db.query(Usuario).filter(Usuario.token_recuperacao == token, Usuario.token_expiracao > datetime.now()).first()
    if not user:
        return {"success": False, "error": "Token inválido ou expirado"}
    user.senha = hash_senha(nova_senha)
    user.token_recuperacao = None
    user.token_expiracao = None
    db.commit()
    return {"success": True}

@router.get("/api/sintomas")
async def api_sintomas(db: Session = Depends(get_db)):
    return [{"id": s.id, "nome": s.nome, "peso_masculino": float(s.peso_masculino or 0), "peso_feminino": float(s.peso_feminino or 0)} for s in db.query(Sintoma).all()]

@router.get("/api/limiares")
async def api_limiares(db: Session = Depends(get_db)):
    return {l.sexo: float(l.valor) for l in db.query(Limiar).all()}

@router.get("/api/instituicoes")
async def api_instituicoes(db: Session = Depends(get_db)):
    return [{"id": i.id, "nome_fantasia": i.nome_fantasia, "nome": i.nome or "", "cnpj": i.cnpj, "cep": i.cep or "", "rua": i.rua or "", "numero": i.numero or "", "complemento": i.complemento or "", "bairro": i.bairro or "", "cidade": i.cidade or "", "estado": i.estado or ""} for i in db.query(Instituicao).all()]

@router.post("/api/instituicao")
async def api_criar_instituicao(request: Request, db: Session = Depends(get_db)):
    require_admin(request)
    body = await request.json()
    nova = Instituicao(**body)
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return {"success": True, "id": nova.id}

@router.put("/api/instituicao/{id}")
async def api_atualizar_instituicao(id: int, request: Request, db: Session = Depends(get_db)):
    require_admin(request)
    body = await request.json()
    
    inst = db.query(Instituicao).filter(Instituicao.id == id).first()
    if not inst: raise HTTPException(status_code=404, detail="Não encontrada")
    
    for key, value in body.items():
        if hasattr(inst, key):
            setattr(inst, key, value)
    
    db.commit()
    db.refresh(inst)
    return {"success": True}

@router.post("/api/paciente/buscar")
async def api_buscar_paciente(request: Request, db: Session = Depends(get_db)):
    require_auth(request)
    body = await request.json()
    cpf_limpo = body["cpf"].replace(".", "").replace("-", "")
    paciente = db.query(Paciente).filter(Paciente.cpf == cpf_limpo).first()
    if not paciente: return {"found": False}
    
    is_admin = request.session.get("tipo") == "Administrador"
    is_owner = paciente.id_medico_responsavel == request.session.get("id_usuario")
    medico_user = db.query(Medico).filter(Medico.id == request.session.get("id_usuario")).first()
    same_inst = medico_user and paciente.id_instituto == medico_user.id_instituto
    
    if is_admin or is_owner or same_inst:
        fotos = {f.tipo: f.caminho for f in paciente.fotos}
        return {
            "found": True,
            "paciente": {
                "id": paciente.id, "nome": paciente.nome, "cpf": paciente.cpf, "sexo": paciente.sexo,
                "data_nascimento": str(paciente.data_nascimento), "telefone": paciente.telefone, "email": paciente.email,
                "foto_face": fotos.get("Frente"), "foto_perfil_esq": fotos.get("Lado Esquerdo"), "foto_perfil_dir": fotos.get("Lado Direito"),
                "instituicao": paciente.instituicao.nome_fantasia if paciente.instituicao else "-",
            },
        }
    return {"found": True, "sem_acesso": True, "medico_nome": paciente.medico.usuario.nome if paciente.medico else "outro médico"}

@router.post("/api/paciente/cadastrar")
async def api_cadastrar_paciente(request: Request, db: Session = Depends(get_db)):
    require_auth(request)
    body = await request.json()
    id_usuario = request.session.get("id_usuario")
    medico = db.query(Medico).filter(Medico.id == id_usuario).first()
    
    # Ensure we get the institution ID either from the request body or the doctor's profile
    id_inst = body.get("id_instituto")
    if not id_inst and medico:
        id_inst = medico.id_instituto
    
    if not id_inst:
        raise HTTPException(status_code=400, detail="Instituição não definida para o médico")
        
    id_medico = medico.id if medico else db.query(Medico).first().id
    
    novo = Paciente(
        id_medico_responsavel=id_medico, id_instituto=id_inst,
        cpf=body["cpf"].replace(".", "").replace("-", ""), nome=body["nome"], sexo=body["sexo"],
        data_nascimento=datetime.strptime(body["data_nascimento"], "%Y-%m-%d").date(),
        telefone=body["telefone"], email=body["email"]
    )
    db.add(novo)
    db.commit()
    return {"success": True, "id": novo.id}

@router.get("/api/pacientes")
async def api_listar_pacientes(request: Request, db: Session = Depends(get_db)):
    require_auth(request)
    if request.session.get("tipo") == "Administrador":
        pacientes = db.query(Paciente).all()
    else:
        pacientes = db.query(Paciente).filter(Paciente.id_medico_responsavel == request.session.get("id_usuario")).all()
    
    res = []
    for p in pacientes:
        fotos = {f.tipo: f.caminho for f in p.fotos}
        res.append({
            "id": p.id, "nome": p.nome, "cpf": p.cpf, "sexo": p.sexo, "data_nascimento": str(p.data_nascimento),
            "telefone": p.telefone, "email": p.email, "id_instituto": p.id_instituto,
            "instituicao": p.instituicao.nome_fantasia if p.instituicao else None,
            "foto_face": fotos.get("Frente"), "foto_perfil_esq": fotos.get("Lado Esquerdo"), "foto_perfil_dir": fotos.get("Lado Direito"),
        })
    return res

@router.post("/api/triagem/calcular")
async def api_triagem(request: Request, db: Session = Depends(get_db)):
    require_auth(request)
    body = await request.json()
    paciente_id = body.get("paciente_id")
    if not paciente_id:
        raise HTTPException(status_code=400, detail="ID do paciente é obrigatório")
        
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
        
    medico_id = request.session.get("id_usuario") or db.query(Medico).first().id
    sintomas = body.get("sintomas", {})
    
    score = calcular_score(sintomas, paciente.sexo, db)
    limiar = get_limiar(db, paciente.sexo)
    atingiu = score >= limiar
    rec = "ENCAMINHAR para teste genético FMR1" if atingiu else "MANTER em observação clínica"
    
    triagem = Triagem(
        id_medico=medico_id, 
        id_paciente=paciente.id, 
        nome_responsavel=body.get("nome_responsavel") or "Não informado", 
        grau_responsavel=body.get("grau_responsavel") or "Não informado", 
        observacoes=body.get("observacoes", "")
    )
    db.add(triagem); db.flush()
    
    for s in db.query(Sintoma).all():
        db.add(TriagemSintoma(
            id_sintoma=s.id, 
            id_triagem=triagem.id, 
            presente=sintomas.get(str(s.id), False) if isinstance(sintomas, dict) else False
        ))
    
    res_obj = Resultado(id_triagem=triagem.id, limiar=limiar, score_total=score, atingiu_limiar=atingiu, justificativa=rec)
    db.add(res_obj); db.flush()
    
    db.add(Notificacao(id_resultado=res_obj.id, destinatario=paciente.email))
    db.commit()
    
    enviar_email(paciente.email, paciente.nome, score, rec, limiar)
    return {"score": score, "limiar": limiar, "atingiu_limiar": atingiu, "recomendacao": rec, "triagem_id": triagem.id}



@router.put("/api/triagem/{triagem_id}")
async def api_editar_triagem(triagem_id: int, request: Request, db: Session = Depends(get_db)):
    require_auth(request)
    body = await request.json()
    t = db.query(Triagem).filter(Triagem.id == triagem_id).first()
    if body.get("data_consulta"): t.realizada_em = datetime.strptime(body["data_consulta"], "%Y-%m-%d")
    t.observacoes = body.get("observacoes", t.observacoes)
    t.nome_responsavel = body.get("nome_responsavel", t.nome_responsavel)
    t.grau_responsavel = body.get("grau_responsavel", t.grau_responsavel)
    db.commit()
    return {"success": True}

@router.get("/api/historico/{paciente_id}")
async def api_historico(paciente_id: int, db: Session = Depends(get_db)):
    triagens = db.query(Triagem).filter(Triagem.id_paciente == paciente_id).all()
    res = []
    for t in triagens:
        rd = db.query(Resultado).filter(Resultado.id_triagem == t.id).first()
        sints = db.query(Sintoma.nome).join(TriagemSintoma).filter(TriagemSintoma.id_triagem == t.id, TriagemSintoma.presente == True).all()
        res.append({
            "id": t.id, "data": t.realizada_em.strftime("%d/%m/%Y %H:%M"), "medico": t.medico.usuario.nome,
            "score": float(rd.score_total) if rd else 0, "recomendacao": rd.justificativa if rd else "",
            "observacoes": t.observacoes, "sintomas": [s.nome for s in sints]
        })
    return res

@router.get("/api/relatorios")
async def api_relatorios(request: Request, db: Session = Depends(get_db)):
    require_auth(request)
    q = db.query(Resultado)
    if request.session.get("tipo") != "Administrador":
        q = q.join(Triagem).filter(Triagem.id_medico == request.session.get("id_usuario"))
    results = q.all()
    data = [{
        "paciente": r.triagem.paciente.nome, "sexo": r.triagem.paciente.sexo, "data": r.gerado_em.strftime("%d/%m/%Y"),
        "score": float(r.score_total), "recomendacao": r.justificativa, "medico": r.triagem.medico.usuario.nome, "atingiu_limiar": r.atingiu_limiar
    } for r in results]
    return {"relatorios": data, "total": len(results), "encaminhados": sum(1 for r in results if r.atingiu_limiar)}

@router.get("/api/usuarios")
async def api_usuarios(db: Session = Depends(get_db)):
    return [{"id": u.id, "nome": u.nome, "cpf": u.cpf, "telefone": u.telefone, "email": u.email, "tipo": u.tipo, "ativo": u.ativo} for u in db.query(Usuario).all()]

@router.post("/api/usuario")
async def api_criar_usuario(request: Request, db: Session = Depends(get_db)):
    require_admin(request)
    body = await request.json()
    u = Usuario(nome=body["nome"], cpf=body["cpf"].replace(".","").replace("-",""), senha=hash_senha(body["senha"]), ativo=True, telefone=body["telefone"], email=body["email"], tipo=body["tipo"])
    db.add(u); db.flush()
    if u.tipo == "Médico" and body.get("crm"):
        db.add(Medico(id=u.id, crm=body["crm"], id_instituto=body.get("id_instituto")))
    db.commit()
    return {"success": True, "id": u.id}

@router.put("/api/usuario/{id}")
async def api_atualizar_usuario(id: int, request: Request, db: Session = Depends(get_db)):
    require_admin(request)
    body = await request.json()
    u = db.query(Usuario).filter(Usuario.id == id).first()
    if not u: raise HTTPException(status_code=404, detail="Usuário não encontrado")
    u.nome = body.get("nome", u.nome)
    u.email = body.get("email", u.email)
    u.tipo = body.get("tipo", u.tipo)
    u.ativo = body.get("ativo", u.ativo)
    # Ensure CPF and other fields are updated if present
    if "cpf" in body: u.cpf = body["cpf"].replace(".","").replace("-","")
    if "telefone" in body: u.telefone = body["telefone"]
    
    if body.get("senha"): u.senha = hash_senha(body["senha"])
    if u.tipo == "Médico":
        m = db.query(Medico).filter(Medico.id == id).first()
        if m:
            if body.get("crm"): m.crm = body["crm"]
            if body.get("id_instituto"): m.id_instituto = body["id_instituto"]
        elif body.get("crm"): db.add(Medico(id=id, crm=body["crm"], id_instituto=body.get("id_instituto")))
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"success": True}

@router.put("/api/paciente/{id}")
async def api_atualizar_paciente(id: int, request: Request, db: Session = Depends(get_db)):
    require_auth(request)
    body = await request.json()
    p = db.query(Paciente).filter(Paciente.id == id).first()
    if not p: raise HTTPException(status_code=404, detail="Paciente não encontrado")
    p.nome = body.get("nome", p.nome)
    p.sexo = body.get("sexo", p.sexo)
    if body.get("data_nascimento"): p.data_nascimento = datetime.strptime(body["data_nascimento"], "%Y-%m-%d").date()
    p.email = body.get("email", p.email)
    p.telefone = body.get("telefone", p.telefone)
    if "cpf" in body: p.cpf = body["cpf"].replace(".", "").replace("-", "")
    # Explicitly check for id_instituto to allow clearing the link
    if "id_instituto" in body:
        p.id_instituto = body["id_instituto"]
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"success": True}

@router.post("/api/paciente/{id}/fotos")
async def api_upload_fotos_paciente(id: int, request: Request, foto_face: UploadFile = File(None), foto_perfil_esq: UploadFile = File(None), foto_perfil_dir: UploadFile = File(None), db: Session = Depends(get_db)):
    require_auth(request)
    p = db.query(Paciente).filter(Paciente.id == id).first()
    base = "sxf_fotos_pacientes"; slug = to_snake_case(p.nome); pasta = os.path.join(base, slug); os.makedirs(pasta, exist_ok=True)
    
    async def salvar(arq, tipo, prefixo):
        if not arq: return None
        ext = arq.filename.split(".")[-1].lower()
        nome = f"{prefixo}_{slug}.{ext}"; path = os.path.join(pasta, nome)
        with open(path, "wb") as f: f.write(await arq.read())
        db.query(FotoPaciente).filter(FotoPaciente.id_paciente == id, FotoPaciente.tipo == tipo).delete()
        db.add(FotoPaciente(id_paciente=id, tipo=tipo, caminho=f"/{base}/{slug}/{nome}"))
        return path

    await salvar(foto_face, "Frente", "frontal")
    await salvar(foto_perfil_esq, "Lado Esquerdo", "lateral_esquerda")
    await salvar(foto_perfil_dir, "Lado Direito", "lateral_direita")
    db.commit()
    return {"success": True}

@router.delete("/api/usuario/{id}")
async def api_excluir_usuario(id: int, request: Request, db: Session = Depends(get_db)):
    require_admin(request)
    u = db.query(Usuario).filter(Usuario.id == id).first()
    if u: u.ativo = False; db.commit()
    return {"success": True}

@router.post("/api/paciente/trocar_medico")
async def api_trocar_medico(request: Request, db: Session = Depends(get_db)):
    require_admin(request)
    body = await request.json()
    p = db.query(Paciente).filter(Paciente.id == body["paciente_id"]).first()
    p.id_medico_responsavel = body["novo_medico_id"]
    m = db.query(Medico).filter(Medico.id == p.id_medico_responsavel).first()
    if m: p.id_instituto = m.id_instituto
    db.commit()
    return {"success": True}

@router.get("/api/medicos")
async def api_medicos(db: Session = Depends(get_db)):
    medicos = db.query(Medico).all()
    return [{"id": m.id, "nome": m.usuario.nome, "crm": m.crm, "cpf": m.usuario.cpf, "telefone": m.usuario.telefone, "email": m.usuario.email, "id_instituto": m.id_instituto, "instituicao": m.instituicao.nome_fantasia if m.instituicao else None, "ativo": m.usuario.ativo} for m in medicos]
