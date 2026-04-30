# 🧬 Plataforma de Triagem: Síndrome do X Frágil (SXF)

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-green?style=for-the-badge)
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
- **Tailwind CSS:** Estilização baseada em utilitários para interface responsiva.
- **Axios:** Consumo de APIs RESTful.

### **Backend (Servidor)**
- **Node.js + Express:** Runtime e framework para a lógica de negócio.
- **Prisma ORM:** Mapeamento de banco de dados com segurança de tipos.
- **JWT (JSON Web Token):** Autenticação segura entre Front e Back.

### **Infraestrutura & Banco**
- **MySQL 8.0:** Banco de dados relacional para persistência de dados.
- **Docker & Docker Compose:** Containerização do banco para garantir paridade de ambiente.
- **Railway:** Infraestrutura de Cloud sugerida para deploy.

---

## 📂 Estrutura do Repositório

```text
projeto-x-fragil/
├── frontend/             # Interface React (Vite)
├── backend/              # API Express (Node.js)
│   └── prisma/           # Schema e Migrations do Banco
├── docker-compose.yml    # Orquestração do MySQL via Docker
├── .env                  # Variáveis de ambiente (Senhas/URLs)
├── .gitignore            # Regras de exclusão do Git (Centralizado)
└── README.md             # Documentação oficial