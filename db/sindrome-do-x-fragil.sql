CREATE DATABASE IF NOT EXISTS sxf_triagem_db;
USE sxf_triagem_db;

CREATE TABLE instituicao(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_fantasia VARCHAR(150) NOT NULL,
    nome VARCHAR(500) NULL,
    rua VARCHAR(150) NOT NULL,
    numero VARCHAR(10) NOT NULL,
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep VARCHAR(9) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE   
);

CREATE TABLE usuario(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_instituto INT NULL,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    telefone VARCHAR(24) NOT NULL,
    email VARCHAR(150) NOT NULL,
    tipo ENUM('Médico','Administrador') NOT NULL,
    token_recuperacao VARCHAR(100) UNIQUE,
    token_expiracao DATETIME,
    FOREIGN KEY (id_instituto) REFERENCES instituicao(id),
	criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medico(
	id INT PRIMARY KEY, 
    crm VARCHAR(13) NOT NULL UNIQUE,
    FOREIGN KEY (id) REFERENCES usuario(id)
);

CREATE TABLE instituto_medico (
    id_instituto INT NOT NULL,
    id_medico INT NOT NULL,
    vinculo_ativo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_instituto, id_medico),
    FOREIGN KEY (id_instituto) REFERENCES instituicao(id),
    FOREIGN KEY (id_medico) REFERENCES medico(id)
);

CREATE TABLE paciente(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_medico_responsavel INT NOT NULL,
    id_instituto INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    sexo ENUM('Feminino', 'Masculino') NOT NULL,
    data_nascimento DATE NOT NULL,
	telefone VARCHAR(24) NOT NULL,
    email VARCHAR(150) NOT NULL,
	criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_medico_responsavel)  REFERENCES medico(id),
    FOREIGN KEY (id_instituto) REFERENCES instituicao(id)

);

CREATE TABLE triagem(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_medico INT NOT NULL,
    id_paciente INT NOT NULL,
    nome_responsavel VARCHAR(100) NULL,
    grau_responsavel VARCHAR(100) NULL,
    observacoes TEXT,
	realizada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_medico) REFERENCES medico(id),
    FOREIGN KEY (id_paciente) REFERENCES paciente(id)
    
);
CREATE TABLE sintomas(
	id INT AUTO_INCREMENT PRIMARY KEY,
	nome VARCHAR(135) NOT NULL,
    peso_feminino DECIMAL(3,2) NULL,
    peso_masculino DECIMAL(3,2) NULL
);

CREATE TABLE triagem_sintoma(
	id_sintoma INT NOT NULL,
    id_triagem INT  NOT NULL,
    presente BOOLEAN NOT NULL,
    PRIMARY KEY (id_sintoma, id_triagem),
    FOREIGN KEY (id_sintoma) REFERENCES sintomas(id),
    FOREIGN KEY (id_triagem) REFERENCES triagem(id)
);

CREATE TABLE resultado(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_triagem INT NOT NULL,
    limiar decimal(3,2) NOT NULL,
    score_total DECIMAL(3,2) NOT NULL,
    atingiu_limiar BOOLEAN NOT NULL, 
    justificativa VARCHAR(100),
    gerado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_triagem) REFERENCES triagem(id)
);
CREATE TABLE limiar(
    id INT AUTO_INCREMENT PRIMARY KEY,
    sexo ENUM('Feminino', 'Masculino') NOT NULL,
    valor DECIMAL(3,2) NOT NULL
);

CREATE TABLE notificacao(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_resultado INT NOT NULL,
    destinatario VARCHAR(150) NOT NULL,
    enviado_em TIMESTAMP,
    FOREIGN KEY (id_resultado) REFERENCES resultado(id)
);

INSERT INTO sintomas (nome, peso_feminino, peso_masculino)
VALUES
    ('Deficiência intelectual', 0.20, 0.32),
    ('Face alongada/orelhas', 0.09, 0.29),
    ('Macroorquidismo', NULL, 0.26),
    ('Hipermobilidade articular', 0.04, 0.19),
    ('Dificuldades de aprendizagem', 0.28, 0.18),
    ('Déficit de atenção', 0.12, 0.17),
    ('Mov. repetitivos', 0.05, 0.17),
    ('Atraso na fala', 0.01, 0.14),
    ('Hiperatividade', 0.04, 0.12),
    ('Evita contato visual', 0.08, 0.06),
    ('Evita contato físico', 0.07, 0.04),
    ('Agressividade', 0.02, 0.01);


SELECT * FROM sintomas;
INSERT INTO limiar (sexo, valor)
VALUES
('Masculino', 0.56),
('Feminino', 0.55);

SELECT * FROM limiar;
