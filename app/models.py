from datetime import datetime
from sqlalchemy import (
    Boolean, Column, Date, DateTime, DECIMAL, ForeignKey,
    Integer, String, Text, Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuario"
    id = Column(Integer, primary_key=True)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False)
    senha = Column(String(255), nullable=False)
    ativo = Column(Boolean, default=True)
    telefone = Column(String(24), nullable=False)
    email = Column(String(150), nullable=False)
    tipo = Column(SQLEnum("Médico", "Administrador"), nullable=False)
    token_recuperacao = Column(String(100), unique=True)
    token_expiracao = Column(DateTime)
    criado_em = Column(DateTime, default=datetime.now)


class Instituicao(Base):
    __tablename__ = "instituicao"
    id = Column(Integer, primary_key=True)
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
    crm = Column(String(13), unique=True, nullable=False)
    id_instituto = Column(Integer, ForeignKey("instituicao.id"), nullable=True)
    usuario = relationship("Usuario")
    instituicao = relationship("Instituicao")


class InstitutoMedico(Base):
    __tablename__ = "instituto_medico"
    id_instituto = Column(Integer, ForeignKey("instituicao.id"), primary_key=True)
    id_medico = Column(Integer, ForeignKey("medico.id"), primary_key=True)
    vinculo_ativo = Column(Boolean, default=True)


class Paciente(Base):
    __tablename__ = "paciente"
    id = Column(Integer, primary_key=True)
    id_medico_responsavel = Column(Integer, ForeignKey("medico.id"), nullable=False)
    id_instituto = Column(Integer, ForeignKey("instituicao.id"), nullable=False)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False)
    sexo = Column(SQLEnum("Feminino", "Masculino"), name='sexo_biologico', nullable=False)
    data_nascimento = Column(Date, nullable=False)
    telefone = Column(String(24), nullable=False)
    email = Column(String(150), nullable=False)
    criado_em = Column(DateTime, default=datetime.now)
    foto_face = Column(String(255), nullable=True)
    foto_perfil_esq = Column(String(255), nullable=True)
    foto_perfil_dir = Column(String(255), nullable=True)
    medico = relationship("Medico")
    instituicao = relationship("Instituicao")


class Sintoma(Base):
    __tablename__ = "sintomas"
    id = Column(Integer, primary_key=True)
    nome = Column(String(135), nullable=False)
    peso_masculino = Column(DECIMAL(3, 2))
    peso_feminino = Column(DECIMAL(3, 2))


class Limiar(Base):
    __tablename__ = "limiar"
    id = Column(Integer, primary_key=True)
    sexo = Column(SQLEnum("Feminino", "Masculino"), nullable=False)
    valor = Column(DECIMAL(3, 2), nullable=False)


class Triagem(Base):
    __tablename__ = "triagem"
    id = Column(Integer, primary_key=True)
    id_medico = Column(Integer, ForeignKey("medico.id"), nullable=False)
    id_paciente = Column(Integer, ForeignKey("paciente.id"), nullable=False)
    nome_responsavel = Column(String(100))
    grau_responsavel = Column(String(100))
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
    id = Column(Integer, primary_key=True)
    id_triagem = Column(Integer, ForeignKey("triagem.id"), nullable=False)
    limiar = Column(DECIMAL(3, 2), nullable=False)
    score_total = Column(DECIMAL(3, 2), nullable=False)
    atingiu_limiar = Column(Boolean, nullable=False)
    justificativa = Column(String(100))
    gerado_em = Column(DateTime, default=datetime.now)
    triagem = relationship("Triagem")


class Notificacao(Base):
    __tablename__ = "notificacao"
    id = Column(Integer, primary_key=True)
    id_resultado = Column(Integer, ForeignKey("resultado.id"), nullable=False)
    destinatario = Column(String(150), nullable=False)
    enviado_em = Column(DateTime)
