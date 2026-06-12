import os
import time
from sqlalchemy import text, inspect
from .db import SessionLocal, engine, Base
from .schema import Sintoma, Limiar, Usuario, Instituicao
from .helpers import hash_senha

def init_db():
    retries = 5
    while retries > 0:
        try:
            inspector = inspect(engine)
            # Create all tables if they don't exist
            Base.metadata.create_all(engine)
            
            tables = inspector.get_table_names()
            print(f"--- [DB] Tabelas confirmadas: {', '.join(tables)} ---")
            return
        except Exception as e:
            retries -= 1
            print(f"--- [DB CONNECT] Banco de dados ainda não está pronto (Tentativas restantes: {retries}) ---")
            if retries == 0:
                print(f"--- [DB FATAL ERROR] Erro final ao conectar: {e} ---")
                raise e
            time.sleep(5)

def init_seed_data():
    db = SessionLocal()
    try:
        # Seed Sintomas
        if db.query(Sintoma).count() == 0:
            print("--- [SEED] Populando tabela de sintomas ---")
            sintomas_data = [
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
                ("Agressividade", 0.02, 0.01)
            ]
            for nome, pf, pm in sintomas_data:
                db.add(Sintoma(nome=nome, peso_feminino=pf, peso_masculino=pm))
            db.commit()

        # Seed Limiares
        if db.query(Limiar).count() == 0:
            print("--- [SEED] Populando tabela de limiares ---")
            db.add(Limiar(sexo="Masculino", valor=0.56))
            db.add(Limiar(sexo="Feminino", valor=0.55))
            db.commit()
            
    except Exception as e:
        print(f"--- [SEED ERROR] Falha ao popular dados: {e} ---")
    finally:
        db.close()

def init_admin():
    db = SessionLocal()
    try:
        admin = db.query(Usuario).filter(Usuario.tipo == "Administrador").first()
        if not admin:
            print("--- [SEED] Criando administrador inicial ---")
            admin_user = Usuario(
                nome="Administrador",
                cpf=os.getenv("ADMIN_CPF"),
                senha=hash_senha(os.getenv("ADMIN_PASSWORD")),
                ativo=True,
                telefone="0000000000",
                email=os.getenv("ADMIN_EMAIL"),
                tipo="Administrador",
            )
            db.add(admin_user)
            db.commit()
            print("--- [SEED] Administrador criado com sucesso ---")
        else:
            print("--- [SEED] Administrador já existente, pulando criação ---")
    except Exception as e:
        print(f"--- [SEED ERROR] Falha ao criar admin: {e} ---")
    finally:
        db.close()
