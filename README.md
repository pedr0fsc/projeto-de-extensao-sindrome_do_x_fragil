# 🧬 Plataforma de Triagem: Síndrome do X Frágil (SXF)

![Status do Projeto](https://img.shields.io/badge/Status-FInalizado-green?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Full_Stack-blue?style=for-the-badge)
![Docker](https://img.shields.io/badge/Environment-Dockerized-cyan?style=for-the-badge&logo=docker)

## 📝 Descrição do Cenário
A **Síndrome do X Frágil** é a principal causa hereditária de deficiência intelectual e a causa genética conhecida mais comum de transtorno do espectro autista (TEA). Devido à complexidade e ao alto custo dos exames genéticos (PCR e Southern Blot), o diagnóstico precoce é um desafio na saúde pública.

Este projeto desenvolve uma plataforma web para **triagem clínica**. Através de um checklist de sinais e sintomas baseados em evidências científicas, o sistema aplica um algoritmo de **Score Ponderado**. O software diferencia os pesos e limiares conforme o sexo e a idade do paciente, fornecendo um indicativo imediato sobre a necessidade de encaminhamento para o diagnóstico genético definitivo.

---

## 🛠️ Stack Tecnológica

### **Frontend (Interface)**
- **React.js + Vite:** Framework de alta performance para SPA (Single Page Application).
- **TypeScript:** Tipagem estática para maior robustez e manutenibilidade.

### **Backend (Servidor)**
- **FastAPI (Python):** Framework moderno e de alta performance para construção de APIs.
- **SQLAlchemy:** ORM para comunicação segura com o banco de dados MySQL.

---

## 🚀 Guia de Instalação e Execução

### 🐳 Para Usuários (Instalação via Docker)
Ideal para rodar a aplicação pronta de forma simples e padronizada.

1.  **Pré-requisitos**: Docker Desktop instalado. Clique aqui para [baixar](https://docs.docker.com/desktop/setup/install/windows-install/)
2.  **Preparação**:
    - Clone o repositório ou baixe os arquivos.
    - Na raiz do projeto, configure as credenciais criando um arquivo `.env` baseado no `.env.example`.<br>
    - Use `copy` para Windows ou `cp` para Linux:<br><br>
    ```bash
    copy .env.example .env
    ```
    - Preencha o arquivo `.env` com suas configurações.
3.  **Execução**:<br><br>
    ```bash
    docker-compose up -d --build
    ```
4.  **Acesso**: A aplicação estará disponível em `http://localhost:3001` (porta padrão, verifique seu `.env`).

### 💻 Para Desenvolvedores (Ambiente Local)
Ideal para contribuições e modificações no código.

#### 1. Preparando o Ambiente
Acesse o site do repositório [aqui](https://github.com/pedr0fsc/projeto-de-extensao-sindrome_do_x_fragil) e faça um Fork (Ou não será possível editar nada por não ter permissão de contribuidor).

Clone o repositório:
```bash
git clone https://github.com/seu-usuario/projeto-de-extensao-sindrome_do_x_fragil.git
cd projeto-de-extensao-sindrome_do_x_fragil
```
Copie o arquivo de exemplo e preencha com suas senhas locais:
```bash
copy .env.example .env
```

#### 2. Frontend (React)
1. Navegue até a pasta do frontend:<br><br>
   ```bash
   cd frontend
   ```
2. Instale as dependências do Node:<br><br>
   ```bash
   npm install
   ```
3. Saia do diretório:<br><br>
   ```bash
   cd ..
   ```

#### 3. Backend (Python)
1. Certifique-se de ter o Python instalado.
2. Instale as dependências necessárias:<br><br>
   ```bash
   pip install -r requirements.txt
   ```
3. Inicie o servidor:<br><br>
   ```bash
   py -m uvicorn main:app --reload
   ```
   *O projeto estará disponível em `http://127.0.0.1:8000/`.*

---

## 📂 Estrutura do Repositório

```text
projeto-de-extensao-sindrome_do_x_fragil/
├── db/sindrome-do-x-fragil.sql     # Arquivo de estruturação do Database SQL
├── frontend/                       # Interface React (Vite)
├── docker-compose.yml              # Orquestração do MySQL via Docker
├── Dockerfile                      # Build dos conteineres Docker (1. React e 2. Python e db)
├── main.py                         # Arquivo .py de backend
├── .env                            # Variáveis de ambiente (Senhas/URLs)
├── .env.example                    # Template das variáveis de ambiente para devs
├── .gitignore                      # Regras de exclusão do Git (Centralizado)
└── README.md                       # Documentação oficial
```

---

## 2. Fluxo de Desenvolvimento (Git Flow)

Crie uma Branch: Nunca trabalhe diretamente na main. Use nomes descritivos:

```
git checkout -b feature/nome-da-sua-alteracao
```

ou

```
git checkout -b fix/correcao-de-bug
```

Commit suas alterações! Seja claro nas mensagens:

```
git add .
git commit -m "feat: adiciona lógica de cálculo do score ponderado"
```
Suba para o GitHub:

```
git push origin feature/nome-da-sua-alteracao
```

### Pull Request (PR): 
Abra um PR no GitHub. Outro desenvolvedor deve revisar seu código antes do Merge para a branch principal.

---

## 🐳 Como Buildar e Rodar (Docker)

### Modo de Desenvolvimento (Local)
Para rodar tudo com um único comando usando Docker:

```
docker-compose up --build
```

### Frontend/Backend: 
Disponível em http://localhost:3001 (ou a porta definida no seu .env).

### Banco de Dados: 
O MySQL subirá automaticamente e executará o script em db/sindrome-do-x-fragil.sql.

### Deploy em Produção (Servidor)

Ao hospedar em plataformas como Railway ou Render:

- Conecte seu repositório GitHub à plataforma.

- Configure as Environment Variables no dashboard da plataforma (copie os campos do seu .env).

- A plataforma detectará o Dockerfile na raiz e iniciará o build multi-stage automaticamente.

## 🔍 Detalhes dos Componentes e Conexões

**Dockerfile (Multi-Stage)**: Otimiza o servidor. No estágio 1, o Node.js compila o React para arquivos estáticos (dist). No estágio 2, o Python assume e serve esses arquivos, eliminando a necessidade de rodar o Node em produção.

**main.py**: Atua como a "ponte". Ele utiliza bibliotecas como FastAPI para servir a interface React e expor endpoints de API que consultam o MySQL.

**docker-compose.yml**: Orquestra a rede interna. O serviço api consegue encontrar o serviço database usando apenas o nome host: database, graças à rede interna do Docker.

**.env**: Centraliza a segurança. Nunca suba este arquivo. Ele garante que sua chave secreta JWT e senhas de banco sejam diferentes entre seu PC e o servidor de produção.

## 📜 Licença

Este projeto está sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.

Desenvolvido para o avanço do diagnóstico genético. 🧬 
