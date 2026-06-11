import os

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from datetime import datetime

from app.database import get_db
from app.dependencies import require_auth, require_admin
from app.helpers import get_default_instituicao, get_institutos_medico
from app.models import Instituicao, Medico, Paciente

router = APIRouter(prefix="/api", tags=["pacientes"])

EXTENSOES_PERMITIDAS = {"jpg", "jpeg", "png", "webp"}


@router.post("/paciente/buscar")
async def api_buscar_paciente(request: Request, db=Depends(get_db), _=Depends(require_auth)):
    body = await request.json()
    cpf_limpo = body["cpf"].replace(".", "").replace("-", "")
    paciente = db.query(Paciente).filter(Paciente.cpf == cpf_limpo).first()
    if not paciente:
        return {"found": False}
    is_admin = request.session.get("tipo") == "Administrador"
    is_owner = paciente.id_medico_responsavel == request.session.get("id_usuario")
    inst_ids = get_institutos_medico(db, request.session.get("id_usuario"))
    same_inst = paciente.id_instituto in inst_ids
    if is_admin or is_owner or same_inst:
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
                "foto_face": paciente.foto_face,
                "foto_perfil_esq": paciente.foto_perfil_esq,
                "foto_perfil_dir": paciente.foto_perfil_dir,
            },
        }
    medico = db.query(Medico).filter(Medico.id == paciente.id_medico_responsavel).first()
    return {"found": True, "sem_acesso": True, "medico_nome": medico.usuario.nome if medico else "outro médico"}


@router.post("/paciente/cadastrar")
async def api_cadastrar_paciente(request: Request, db=Depends(get_db), _=Depends(require_auth)):
    body = await request.json()
    medico = db.query(Medico).filter(Medico.id == request.session.get("id_usuario")).first()
    if not medico and request.session.get("tipo") != "Administrador":
        raise HTTPException(status_code=400, detail="Médico não encontrado")

    id_instituto = body.get("id_instituto")
    if id_instituto is not None:
        instituicao = db.query(Instituicao).filter(Instituicao.id == id_instituto).first()
    elif medico and medico.id_instituto:
        instituicao = db.query(Instituicao).filter(Instituicao.id == medico.id_instituto).first()
    else:
        instituicao = get_default_instituicao(db)

    if not instituicao:
        raise HTTPException(status_code=400, detail="Instituição não encontrada")

    medico_responsavel = medico or db.query(Medico).order_by(Medico.id).first()
    if not medico_responsavel:
        raise HTTPException(status_code=400, detail="Nenhum médico disponível")

    novo = Paciente(
        id_medico_responsavel=medico_responsavel.id,
        id_instituto=instituicao.id,
        cpf=body["cpf"].replace(".", "").replace("-", ""),
        nome=body["nome"],
        sexo=body["sexo"],
        data_nascimento=datetime.strptime(body["data_nascimento"], "%Y-%m-%d").date(),
        telefone=body["telefone"],
        email=body["email"],
    )
    db.add(novo)
    db.commit()
    return {"success": True, "id": novo.id}


@router.get("/pacientes")
async def api_listar_pacientes(request: Request, db=Depends(get_db), _=Depends(require_auth)):
    if request.session.get("tipo") == "Administrador":
        pacientes = db.query(Paciente).all()
    else:
        pacientes = db.query(Paciente).filter(
            Paciente.id_medico_responsavel == request.session.get("id_usuario")
        ).all()
    return [
        {
            "id": p.id, "nome": p.nome, "cpf": p.cpf, "sexo": p.sexo,
            "data_nascimento": str(p.data_nascimento), "telefone": p.telefone,
            "email": p.email, "foto_face": p.foto_face,
            "foto_perfil_esq": p.foto_perfil_esq, "foto_perfil_dir": p.foto_perfil_dir,
        }
        for p in pacientes
    ]


@router.put("/paciente/{id}")
async def api_atualizar_paciente(id: int, request: Request, db=Depends(get_db), _=Depends(require_auth)):
    body = await request.json()
    paciente = db.query(Paciente).filter(Paciente.id == id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    is_admin = request.session.get("tipo") == "Administrador"
    if not is_admin and paciente.id_medico_responsavel != request.session.get("id_usuario"):
        raise HTTPException(status_code=403, detail="Sem permissão")
    paciente.nome = body["nome"]
    paciente.cpf = body["cpf"].replace(".", "").replace("-", "")
    paciente.sexo = body["sexo"]
    paciente.data_nascimento = datetime.strptime(body["data_nascimento"], "%Y-%m-%d").date()
    paciente.telefone = body["telefone"].replace("(", "").replace(")", "").replace(" ", "").replace("-", "")
    paciente.email = body["email"]
    db.commit()
    return {"success": True}


@router.post("/paciente/trocar_medico")
async def api_trocar_medico(request: Request, db=Depends(get_db), _=Depends(require_admin)):
    body = await request.json()
    novo_medico = db.query(Medico).filter(Medico.id == body["novo_medico_id"]).first()
    update_data = {"id_medico_responsavel": body["novo_medico_id"]}
    if novo_medico and novo_medico.id_instituto:
        update_data["id_instituto"] = novo_medico.id_instituto
    db.query(Paciente).filter(Paciente.id == body["paciente_id"]).update(update_data)
    db.commit()
    return {"success": True}


@router.post("/paciente/{id}/fotos")
async def api_upload_fotos_paciente(
    id: int,
    request: Request,
    foto_face: UploadFile = File(default=None),
    foto_perfil_esq: UploadFile = File(default=None),
    foto_perfil_dir: UploadFile = File(default=None),
    db=Depends(get_db),
    _=Depends(require_auth),
):
    paciente = db.query(Paciente).filter(Paciente.id == id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    is_admin = request.session.get("tipo") == "Administrador"
    if not is_admin and paciente.id_medico_responsavel != request.session.get("id_usuario"):
        raise HTTPException(status_code=403, detail="Sem permissão")

    pasta = f"uploads/pacientes/{id}"
    os.makedirs(pasta, exist_ok=True)

    async def salvar_foto(arquivo: UploadFile, nome: str):
        if not arquivo or not arquivo.filename:
            return None
        ext = arquivo.filename.rsplit(".", 1)[-1].lower()
        if ext not in EXTENSOES_PERMITIDAS:
            raise HTTPException(status_code=400, detail=f"Formato inválido: {ext}")
        caminho = f"{pasta}/{nome}.{ext}"
        with open(caminho, "wb") as f:
            f.write(await arquivo.read())
        return f"/{caminho}"

    face_path = await salvar_foto(foto_face, "face")
    esq_path = await salvar_foto(foto_perfil_esq, "perfil_esq")
    dir_path = await salvar_foto(foto_perfil_dir, "perfil_dir")

    if face_path is not None:
        paciente.foto_face = face_path
    if esq_path is not None:
        paciente.foto_perfil_esq = esq_path
    if dir_path is not None:
        paciente.foto_perfil_dir = dir_path

    db.commit()
    return {
        "success": True,
        "foto_face": paciente.foto_face,
        "foto_perfil_esq": paciente.foto_perfil_esq,
        "foto_perfil_dir": paciente.foto_perfil_dir,
    }
