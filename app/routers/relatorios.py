from fastapi import APIRouter, Depends, Request

from app.database import get_db
from app.dependencies import require_auth
from app.models import Resultado, Triagem, Usuario

router = APIRouter(prefix="/api", tags=["relatorios"])


@router.get("/relatorios")
async def api_relatorios(request: Request, db=Depends(get_db), _=Depends(require_auth)):
    is_admin = request.session.get("tipo") == "Administrador"
    if is_admin:
        resultados = db.query(Resultado).all()
    else:
        resultados = (db.query(Resultado).join(Triagem)
                      .filter(Triagem.id_medico == request.session.get("id_usuario")).all())

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
