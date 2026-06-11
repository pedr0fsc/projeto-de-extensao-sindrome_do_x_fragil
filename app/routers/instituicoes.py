from fastapi import APIRouter, Depends, Request

from app.database import get_db
from app.dependencies import require_admin
from app.models import Instituicao

router = APIRouter(prefix="/api", tags=["instituicoes"])


@router.get("/instituicoes")
async def api_instituicoes(db=Depends(get_db)):
    return [
        {
            "id": i.id,
            "nome_fantasia": i.nome_fantasia,
            "nome": i.nome,
            "cidade": i.cidade,
            "estado": i.estado,
            "cnpj": i.cnpj,
        }
        for i in db.query(Instituicao).all()
    ]


@router.post("/instituicao")
async def api_criar_instituicao(request: Request, db=Depends(get_db), _=Depends(require_admin)):
    body = await request.json()
    nova = Instituicao(
        nome_fantasia=body["nome_fantasia"],
        nome=body.get("nome"),
        rua=body["rua"],
        numero=body["numero"],
        complemento=body.get("complemento"),
        bairro=body["bairro"],
        cidade=body["cidade"],
        estado=body["estado"],
        cep=body["cep"],
        cnpj=body["cnpj"],
    )
    db.add(nova)
    db.commit()
    return {"success": True, "id": nova.id}
