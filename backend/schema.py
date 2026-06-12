from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, DECIMAL, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class Usuario(Base):
    __tablename__ = "usuario"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False)
    senha = Column(String(255), nullable=False)
    telefone = Column(String(24), nullable=False)
    email = Column(String(150), nullable=False, unique=True)
    tipo = Column(SQLEnum("Médico", "Administrador"), nullable=False)
    ativo = Column(Boolean, nullable=False, default=True)
    token_recuperacao = Column(String(100), unique=True)
    token_expiracao = Column(DateTime)
    criado_em = Column(DateTime, default=datetime.now)

class Instituicao(Base):
    __tablename__ = "instituicao"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome_fantasia = Column(String(150), nullable=False)
    nome = Column(String(500))
    rua = Column(String(150), nullable=False)
    numero = Column(String(10), nullable=False)
    complemento = Column(String(100))
    bairro = Column(String(100), nullable=False)
    cidade = Column(String(100), nullable=False)
    estado = Column(String(2), nullable=False)
    cep = Column(String(9), nullable=False)
    cnpj = Column(String(18), nullable=False, unique=True)

class Medico(Base):
    __tablename__ = "medico"
    id = Column(Integer, ForeignKey("usuario.id"), primary_key=True)
    id_instituto = Column(Integer, ForeignKey("instituicao.id"), nullable=False)
    crm = Column(String(13), unique=True, nullable=False)
    
    usuario = relationship("Usuario")
    instituicao = relationship("Instituicao")

class Paciente(Base):
    __tablename__ = "paciente"
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_medico_responsavel = Column(Integer, ForeignKey("medico.id"), nullable=False)
    id_instituto = Column(Integer, ForeignKey("instituicao.id"), nullable=False)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False)
    sexo = Column(SQLEnum("Feminino", "Masculino"), name='sexo_biologico', nullable=False)
    data_nascimento = Column(Date, nullable=False)
    telefone = Column(String(24), nullable=False)
    email = Column(String(150), nullable=False)
    criado_em = Column(DateTime, default=datetime.now)
    
    medico = relationship("Medico")
    instituicao = relationship("Instituicao")
    fotos = relationship("FotoPaciente", back_populates="paciente", cascade="all, delete-orphan")

class FotoPaciente(Base):
    __tablename__ = "foto_paciente"
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_paciente = Column(Integer, ForeignKey("paciente.id"), nullable=False)
    tipo = Column(SQLEnum("Frente", "Lado Esquerdo", "Lado Direito"), nullable=False)
    caminho = Column(String(255), nullable=False)
    data_upload = Column(DateTime, default=datetime.now)
    
    paciente = relationship("Paciente", back_populates="fotos")

class Sintoma(Base):
    __tablename__ = "sintomas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(135), nullable=False)
    peso_masculino = Column(DECIMAL(3, 2))
    peso_feminino = Column(DECIMAL(3, 2))

class Limiar(Base):
    __tablename__ = "limiar"
    id = Column(Integer, primary_key=True, autoincrement=True)
    sexo = Column(SQLEnum("Feminino", "Masculino"), nullable=False)
    valor = Column(DECIMAL(3, 2), nullable=False)

class Triagem(Base):
    __tablename__ = "triagem"
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_medico = Column(Integer, ForeignKey("medico.id"), nullable=False)
    id_paciente = Column(Integer, ForeignKey("paciente.id"), nullable=False)
    nome_responsavel = Column(String(150), nullable=False)
    grau_responsavel = Column(String(100), nullable=False)
    observacoes = Column(Text)
    realizada_em = Column(DateTime, default=datetime.now)
    
    medico = relationship("Medico")
    paciente = relationship("Paciente")

class TriagemSintoma(Base):
    __tablename__ = "triagem_sintoma"
    id_sintoma = Column(Integer, ForeignKey("sintomas.id"), primary_key=True)
    id_triagem = Column(Integer, ForeignKey("triagem.id"), primary_key=True)
    presente = Column(Boolean, nullable=False)

class Resultado(Base):
    __tablename__ = "resultado"
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_triagem = Column(Integer, ForeignKey("triagem.id"), nullable=False, unique=True)
    limiar = Column(DECIMAL(3, 2), nullable=False)
    score_total = Column(DECIMAL(3, 2), nullable=False)
    atingiu_limiar = Column(Boolean, nullable=False)
    justificativa = Column(String(255))
    gerado_em = Column(DateTime, default=datetime.now)
    
    triagem = relationship("Triagem")

class Notificacao(Base):
    __tablename__ = "notificacao"
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_resultado = Column(Integer, ForeignKey("resultado.id"), nullable=False)
    destinatario = Column(String(150), nullable=False)
    enviado_em = Column(DateTime)
