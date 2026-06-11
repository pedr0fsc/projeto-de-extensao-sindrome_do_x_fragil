from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.database import get_db
from app.dependencies import require_auth
from app.helpers import calcular_score, enviar_email, gerar_pdf, get_limiar
from app.models import (
    Limiar, Medico, Notificacao, Paciente, Resultado,
    Sintoma, Triagem, TriagemSintoma, Usuario,
)

router = APIRouter(prefix="/api", tags=["triagem"])


@router.get("/sintomas")
async def api_sintomas(db=Depends(get_db)):
    return [
        {
            "id": s.id, "nome": s.nome,
            "peso_masculino": float(s.peso_masculino) if s.peso_masculino else 0,
            "peso_feminino": float(s.peso_feminino) if s.peso_feminino else 0,
        }
        for s in db.query(Sintoma).all()
    ]


@router.get("/limiares")
async def api_limiares(db=Depends(get_db)):
    return {l.sexo: float(l.valor) for l in db.query(Limiar).all()}


@router.post("/triagem/calcular")
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
        id_triagem=triagem.id, limiar=limiar,
        score_total=score, atingiu_limiar=atingiu, justificativa=recomendacao,
    )
    db.add(resultado)
    db.flush()

    notif = Notificacao(id_resultado=resultado.id, destinatario=paciente.email)
    db.add(notif)
    db.commit()

    if enviar_email(paciente.email, paciente.nome, score, recomendacao, limiar):
        notif.enviado_em = datetime.now()
        db.commit()

    return {"score": score, "limiar": limiar, "atingiu_limiar": atingiu,
            "recomendacao": recomendacao, "triagem_id": triagem.id}


@router.get("/triagem/imprimir/{triagem_id}")
async def api_imprimir(triagem_id: int, db=Depends(get_db), _=Depends(require_auth)):
    resultado = db.query(Resultado).filter(Resultado.id_triagem == triagem_id).first()
    triagem = db.query(Triagem).filter(Triagem.id == triagem_id).first()
    paciente = triagem.paciente
    medico_user = db.query(Usuario).filter(Usuario.id == triagem.id_medico).first()
    pdf = gerar_pdf(
        paciente.nome, paciente.data_nascimento.strftime("%d/%m/%Y"),
        paciente.sexo, float(resultado.score_total), resultado.justificativa,
        medico_user.nome if medico_user else "Médico",
        triagem.observacoes, float(resultado.limiar),
    )
    filename = f"relatorio_{paciente.nome.replace(' ', '_')}.pdf"
    return StreamingResponse(pdf, media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.put("/triagem/{triagem_id}")
async def api_editar_triagem(triagem_id: int, request: Request, db=Depends(get_db), _=Depends(require_auth)):
    body = await request.json()
    triagem = db.query(Triagem).filter(Triagem.id == triagem_id).first()
    if not triagem:
        raise HTTPException(status_code=404, detail="Consulta não encontrada")
    is_admin = request.session.get("tipo") == "Administrador"
    if not (is_admin or triagem.id_medico == request.session.get("id_usuario")):
        raise HTTPException(status_code=403, detail="Sem permissão")
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


@router.get("/historico/{paciente_id}")
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
