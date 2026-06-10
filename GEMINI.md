# Instruções do Projeto: Plataforma de Triagem Síndrome do X Frágil (SXF)

Bem-vindo ao repositório do projeto de extensão de triagem da Síndrome do X Frágil. Este guia define as diretrizes de desenvolvimento, arquitetura e convenções para este projeto.

## 1. Visão Geral
O projeto é uma plataforma web full-stack para triagem clínica da Síndrome do X Frágil, utilizando um algoritmo de Score Ponderado baseado em evidências científicas.

### Tecnologias:
*   **Frontend**: React.js, Vite, TypeScript.
*   **Backend**: Python, FastAPI, SQLAlchemy.
*   **Banco de Dados**: MySQL.
*   **Orquestração/Ambiente**: Docker, Docker Compose.

## 2. Estrutura do Projeto
```text
projeto-de-extensao-sindrome_do_x_fragil/
├── db/                             # Script de estruturação do Database SQL
├── frontend/                       # Interface React (Vite)
├── docker-compose.yml              # Orquestração do MySQL/App via Docker
├── Dockerfile                      # Build multi-stage (React build -> Python server)
├── main.py                         # Ponto de entrada do backend
├── .env.example                    # Template de variáveis de ambiente
└── ...
```

## 3. Comandos Importantes

### Ambiente de Desenvolvimento (Docker)
Para iniciar todo o projeto (Backend, Frontend e DB) de forma integrada:
```bash
docker-compose up --build
```

### Desenvolvimento Local (Manual)

#### Backend
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
*Acesse em: `http://localhost:8000`*

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
*Acesse em: `http://localhost:5173`*

## 4. Convenções de Desenvolvimento

*   **Git Flow**:
    *   Nunca trabalhe diretamente na `main`.
    *   Use branches para funcionalidades ou correções: `feature/nome-da-alteracao` ou `fix/correcao-de-bug`.
    *   Commit messages devem ser claros e descritivos.
    *   **Sempre** utilize Pull Requests para revisão de código antes do merge na `main`.
*   **Segurança**:
    *   Nunca comite o arquivo `.env`.
    *   Utilize o `.env.example` como template para configurar suas variáveis de ambiente localmente.
*   **Docker**:
    *   O `Dockerfile` utiliza uma abordagem multi-stage para otimização em produção (compilação do React, servida pelo Python).
