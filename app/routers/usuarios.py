from fastapi import APIRouter, Depends, HTTPException, Request

from app.database import get_db
from app.dependencies import require_admin
from app.helpers import hash_senha, sincronizar_ativo_medico
from app.models import InstitutoMedico, Medico, Paciente, Usuario

router = APIRouter(prefix="/api", tags=["usuarios"])


@router.get("/usuarios")
async def api_usuarios(db=Depends(get_db), _=Depends(require_admin)):
    return [
        {"id": u.id, "nome": u.nome, "cpf": u.cpf, "telefone": u.telefone,
         "email": u.email, "tipo": u.tipo, "ativo": u.ativo}
        for u in db.query(Usuario).all()
    ]


@router.post("/usuario")
async def api_criar_usuario(request: Request, db=Depends(get_db), _=Depends(require_admin)):
    body = await request.json()
    novo = Usuario(
        nome=body["nome"],
        cpf=body["cpf"].replace(".", "").replace("-", ""),
        senha=hash_senha(body["senha"]),
        ativo=True,
        telefone=body["telefone"],
        email=body["email"],
        tipo=body["tipo"],
    )
    db.add(novo)
    db.flush()
    if body["tipo"] == "Médico" and body.get("crm"):
        db.add(Medico(id=novo.id, crm=body["crm"], id_instituto=body.get("id_instituto")))
    db.commit()
    return {"success": True, "id": novo.id}


@router.put("/usuario/{id}")
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
    user.ativo = body.get("ativo", user.ativo)
    if body.get("senha"):
        user.senha = hash_senha(body["senha"])

    if user.tipo == "Médico":
        medico = db.query(Medico).filter(Medico.id == id).first()
        if medico:
            if body.get("crm"):
                medico.crm = body["crm"]
            if body.get("id_instituto") is not None:
                medico.id_instituto = body["id_instituto"]
        elif body.get("crm"):
            db.add(Medico(id=user.id, crm=body["crm"], id_instituto=body.get("id_instituto")))

    db.commit()
    return {"success": True}


@router.delete("/usuario/{id}")
async def api_excluir_usuario(id: int, db=Depends(get_db), _=Depends(require_admin)):
    user = db.query(Usuario).filter(Usuario.id == id).first()
    if user:
        user.ativo = False
        db.query(InstitutoMedico).filter(InstitutoMedico.id_medico == id).update({"vinculo_ativo": False})
        db.commit()
    return {"success": True}


@router.put("/usuario/{id}/instituto/{id_instituto}/ativo")
async def api_toggle_vinculo(id: int, id_instituto: int, request: Request, db=Depends(get_db), _=Depends(require_admin)):
    body = await request.json()
    vinculo = db.query(InstitutoMedico).filter(
        InstitutoMedico.id_medico == id,
        InstitutoMedico.id_instituto == id_instituto
    ).first()
    if not vinculo:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    vinculo.vinculo_ativo = body.get("ativo", False)
    db.flush()
    sincronizar_ativo_medico(db, id)
    db.commit()
    return {"success": True}


@router.get("/medicos")
async def api_medicos(db=Depends(get_db)):
    return [
        {
            "id": m.id,
            "nome": m.usuario.nome,
            "crm": m.crm,
            "email": m.usuario.email,
            "cpf": m.usuario.cpf,
            "telefone": m.usuario.telefone,
            "tipo": m.usuario.tipo,
            "ativo": bool(m.usuario.ativo),
            "id_instituto": m.id_instituto,
            "instituicao": m.instituicao.nome_fantasia if m.instituicao else None,
        }
        for m in db.query(Medico).join(Usuario).all()
    ]
