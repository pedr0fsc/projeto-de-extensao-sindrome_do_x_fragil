import os
import time

from sqlalchemy import inspect, text

from app.database import engine, SessionLocal, Base
from app.helpers import hash_senha
from app.models import Limiar, Sintoma, Usuario  # noqa: F401 — garante registro no Base


def init_db():
    print("--- [DB] Aguardando conexão com o banco de dados... ---")
    retries = 3
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            inspector = inspect(engine)

            # Migração: coluna id_instituto em medico
            columns_medico = [c["name"] for c in inspector.get_columns("medico")]
            if "id_instituto" not in columns_medico:
                print("--- [DB MIGRATION] Adicionando coluna 'id_instituto' na tabela 'medico' ---")
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE medico ADD COLUMN id_instituto INT NULL"))
                    conn.execute(text(
                        "ALTER TABLE medico ADD CONSTRAINT fk_medico_instituicao "
                        "FOREIGN KEY (id_instituto) REFERENCES instituicao(id)"
                    ))

            # Migração: colunas de foto em paciente
            columns_paciente = [c["name"] for c in inspector.get_columns("paciente")]
            for col, definition in {
                "foto_face": "VARCHAR(255) NULL",
                "foto_perfil_esq": "VARCHAR(255) NULL",
                "foto_perfil_dir": "VARCHAR(255) NULL",
            }.items():
                if col not in columns_paciente:
                    print(f"--- [DB MIGRATION] Adicionando coluna '{col}' na tabela 'paciente' ---")
                    with engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE paciente ADD COLUMN {col} {definition}"))

            tables = inspector.get_table_names()
            print(f"--- [DB] Tabelas confirmadas: {', '.join(tables)} ---")
            return
        except Exception as e:
            retries -= 1
            print(f"--- [DB CONNECT] Banco ainda não está pronto (tentativas restantes: {retries}) ---")
            if retries == 0:
                print("--- [DB WARNING] Não conseguiu conectar, iniciando assim mesmo... ---")
            time.sleep(2)


def init_seed_data():
    db = SessionLocal()
    try:
        if db.query(Sintoma).count() == 0:
            print("--- [SEED] Populando tabela de sintomas ---")
            for nome, pf, pm in [
                ("Deficiência intelectual", 0.20, 0.32),
                ("Face alongada/orelhas", 0.09, 0.29),
                ("Macroorquidismo", None, 0.26),
                ("Hipermobilidade articular", 0.04, 0.19),
                ("Dificuldades de aprendizagem", 0.28, 0.18),
                ("Déficit de atenção", 0.12, 0.17),
                ("Mov. repetitivos", 0.05, 0.17),
                ("Atraso na fala", 0.01, 0.14),
                ("Hiperatividade", 0.04, 0.12),
                ("Evita contato visual", 0.08, 0.06),
                ("Evita contato físico", 0.07, 0.04),
                ("Agressividade", 0.02, 0.01),
            ]:
                db.add(Sintoma(nome=nome, peso_feminino=pf, peso_masculino=pm))
            db.commit()

        if db.query(Limiar).count() == 0:
            print("--- [SEED] Populando tabela de limiares ---")
            db.add(Limiar(sexo="Masculino", valor=0.56))
            db.add(Limiar(sexo="Feminino", valor=0.55))
            db.commit()
    except Exception as e:
        print(f"--- [SEED ERROR] {e} ---")
    finally:
        db.close()


def init_admin():
    db = SessionLocal()
    try:
        if not db.query(Usuario).filter(Usuario.tipo == "Administrador").first():
            print("--- [SEED] Criando administrador inicial ---")
            db.add(Usuario(
                nome="Administrador",
                cpf=os.getenv("ADMIN_CPF"),
                senha=hash_senha(os.getenv("ADMIN_PASSWORD")),
                ativo=True,
                telefone="0000000000",
                email=os.getenv("ADMIN_EMAIL"),
                tipo="Administrador",
            ))
            db.commit()
            print("--- [SEED] Administrador criado com sucesso ---")
        else:
            print("--- [SEED] Administrador já existente ---")
    except Exception as e:
        print(f"--- [SEED ERROR] {e} ---")
    finally:
        db.close()
