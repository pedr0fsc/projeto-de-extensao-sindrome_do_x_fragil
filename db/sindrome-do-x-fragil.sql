SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE sxf_triagem_db;

SELECT '--- Iniciando criação das tabelas ---' AS info;

SELECT 'Criando tabela instituicao...' AS info;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Criando tabela usuario...' AS info;
CREATE TABLE usuario(
	id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    telefone VARCHAR(24) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    tipo ENUM('Médico','Administrador') NOT NULL,
    token_recuperacao VARCHAR(100) UNIQUE,
    token_expiracao DATETIME,
	criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Criando tabela medico...' AS info;
CREATE TABLE medico(
	id INT PRIMARY KEY, 
    crm VARCHAR(13) NOT NULL UNIQUE,
    FOREIGN KEY (id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Criando tabela instituto_medico...' AS info;
CREATE TABLE instituto_medico (
    id_instituto INT NOT NULL,
    id_medico INT NOT NULL,
    vinculo_ativo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_instituto, id_medico),
    FOREIGN KEY (id_instituto) REFERENCES instituicao(id),
    FOREIGN KEY (id_medico) REFERENCES medico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Criando tabela paciente...' AS info;
CREATE TABLE paciente(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_medico_responsavel INT NOT NULL,
    id_instituto INT NULL, -- Made NULL to simplify first creation
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    sexo_biologico ENUM('Feminino', 'Masculino') NOT NULL,
    data_nascimento DATE NOT NULL,
	telefone VARCHAR(24) NOT NULL,
    email VARCHAR(150) NOT NULL,
	criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_medico_responsavel)  REFERENCES medico(id),
    FOREIGN KEY (id_instituto) REFERENCES instituicao(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Criando tabela foto_paciente...' AS info;
CREATE TABLE foto_paciente(
	id INT AUTO_INCREMENT PRIMARY KEY,
	id_paciente INT NOT NULL,
	tipo ENUM('Frente', 'Lado Esquerdo', 'Lado Direito') NOT NULL,
	caminho VARCHAR(255) NOT NULL,
	data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (id_paciente) REFERENCES paciente(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Criando tabela triagem...' AS info;
CREATE TABLE triagem(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_medico INT NOT NULL,
    id_paciente INT NOT NULL,
    nome_responsavel VARCHAR(150) NOT NULL,
    grau_responsavel VARCHAR(100) NOT NULL,
    observacoes TEXT,
	realizada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_medico) REFERENCES medico(id),
    FOREIGN KEY (id_paciente) REFERENCES paciente(id)    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Criando tabela sintomas...' AS info;
CREATE TABLE sintomas(
	id INT AUTO_INCREMENT PRIMARY KEY,
	nome VARCHAR(135) NOT NULL,
    peso_feminino DECIMAL(3,2) NULL,
    peso_masculino DECIMAL(3,2) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Criando tabela triagem_sintoma...' AS info;
CREATE TABLE triagem_sintoma(
	id_sintoma INT NOT NULL,
    id_triagem INT  NOT NULL,
    presente BOOLEAN NOT NULL,
    PRIMARY KEY (id_sintoma, id_triagem),
    FOREIGN KEY (id_sintoma) REFERENCES sintomas(id),
    FOREIGN KEY (id_triagem) REFERENCES triagem(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Criando tabela resultado...' AS info;
CREATE TABLE resultado(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_triagem INT NOT NULL,
    limiar decimal(3,2) NOT NULL,
    score_total DECIMAL(3,2) NOT NULL,
    atingiu_limiar BOOLEAN NOT NULL, 
    justificativa VARCHAR(255),
    gerado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_triagem) REFERENCES triagem(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Criando tabela limiar...' AS info;
CREATE TABLE limiar(
    id INT AUTO_INCREMENT PRIMARY KEY,
    sexo ENUM('Feminino', 'Masculino') NOT NULL,
    valor DECIMAL(3,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Criando tabela notificacao...' AS info;
CREATE TABLE notificacao(
	id INT AUTO_INCREMENT PRIMARY KEY,
    id_resultado INT NOT NULL,
    destinatario VARCHAR(150) NOT NULL,
    enviado_em TIMESTAMP,
    FOREIGN KEY (id_resultado) REFERENCES resultado(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Populando tabela sintomas...' AS info;
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

SELECT 'Populando tabela limiar...' AS info;
INSERT INTO limiar (sexo, valor)
VALUES
('Masculino', 0.56),
('Feminino', 0.55);

SELECT '--- Inicialização concluída com sucesso ---' AS info;
