CREATE DATABASE sxf_triagem_db;
USE sxf_triagem_db;

CREATE TABLE usuario(
	id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL,
    telefone VARCHAR(24) NOT NULL,
    email VARCHAR(150) NOT NULL,
    tipo ENUM('Médico','Administrador') NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE medico(
	id INT PRIMARY KEY, 
    crm VARCHAR(13) NOT NULL UNIQUE,
    FOREIGN KEY (id) REFERENCES usuario(id)
);

CREATE TABLE paciente(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_medico INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    sexo ENUM('Feminino', 'Masculino') NOT NULL,
    data_nascimento DATE NOT NULL,
	telefone VARCHAR(24) NOT NULL,
    email VARCHAR(150) NOT NULL,
	criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_medico)  REFERENCES medico(id)
);

CREATE TABLE triagem(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_medico INT NOT NULL,
    id_paciente INT NOT NULL,
    nome_responsavel VARCHAR(100) NULL,
    grau_responsavel VARCHAR(100) NULL,
    observacoes TEXT,
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

CREATE TABLE notificacao(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_resultado INT NOT NULL,
    destinatario VARCHAR(150) NOT NULL,
    enviado_em TIMESTAMP,
    tipo_envio ENUM('email', 'whats') NOT NULL,
    FOREIGN KEY (id_resultado) REFERENCES resultado(id)
);

INSERT INTO sintomas (nome, peso_feminino, peso_masculino)
VALUES
	('Deficiência intelectual', 0.32, 0.20),
	('Face alongada/orelhas', 0.29, 0.09),
	('Macroorquidismo', 0.26, NULL),
	('Hipermobilidade articular', 0.19, 0.04),
	('Dificuldades de aprendizagem', 0.18, 0.28),
	('Déficit de atenção', 0.17, 0.12),
	('Mov. repetitivos', 0.17, 0.05),
	('Atraso na fala', 0.14, 0.01),
	('Hiperatividade', 0.12, 0.04),
	('Evita contato visual', 0.06, 0.08),
	('Evita contato físico', 0.04, 0.07),
	('Agressividade', 0.01, 0.02);


SELECT* FROM sintomas;
