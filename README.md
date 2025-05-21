# Phishing Detector

## Descrição

O **Phishing Detector** é uma aplicação que analisa URLs para identificar possíveis ameaças de phishing. Ele utiliza uma combinação de técnicas, como verificação de listas negras, análise de características da URL, validação de certificados SSL, e análise de conteúdo para determinar se uma URL é maliciosa. A aplicação é composta por um backend desenvolvido em Python com FastAPI e um frontend em React com TypeScript.

## Funcionalidades

- Verificação de URLs em listas negras (ex.: OpenPhish).
- Análise de características suspeitas em URLs, como números excessivos, subdomínios e caracteres especiais.
- Validação de certificados SSL e análise de DNS.
- Análise de conteúdo para identificar formulários e imagens suspeitas.
- Histórico de verificações realizadas.

## Estrutura do Projeto

- **backend/**: Contém a API desenvolvida com FastAPI e a lógica de análise de URLs.
- **frontend/**: Interface do usuário desenvolvida em Vite.

## Pré-requisitos (Instalação Manual)

- **Backend**:
  - Python 3.10 ou superior
  - Gerenciador de pacotes `pip`

- **Frontend**:
  - Node.js 18 ou superior
  - Gerenciador de pacotes `npm` ou `yarn`

## Rodar a Aplicação

### Com Docker

1. Certifique-se de ter o Docker instalado e em execução.

2. Navegue até o diretório do projeto:
   ```bash
   cd phishing-detector
   ```
3. Construa e inicie os containers:
   ```bash
   docker-compose up --build
   ```
4. Acesse a aplicação no navegador:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend: [http://localhost:8000](http://localhost:8000)

### Instalação Manual

**Backend**

1. Navegue até o diretório do backend:
   ```bash
   cd backend
   ```

2. Crie um ambiente virtual (opcional, mas recomendado):
   ```bash
   python3 -m venv .venv
   ```

3. Ative o ambiente virtual:
   ```bash
   source .venv/bin/activate  # Linux/Mac
   .venv\Scripts\activate  # Windows
   ```

4. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

5. Inicie o servidor FastAPI:
   ```bash
   uvicorn app.main:app --reload
   ```

6. A API estará disponível em: [http://localhost:8000](http://localhost:8000)

**Frontend**

1. Navegue até o diretório do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. A interface estará disponível em: [http://localhost:5173](http://localhost:5173)


## Estrutura do Banco de Dados

O banco de dados utiliza SQLite e armazena os resultados das análises realizadas. A tabela principal é `check_results`, que contém informações como:

- URL analisada
- Indicadores de phishing (ex.: números suspeitos, subdomínios excessivos, etc.)
- Informações sobre SSL e DNS
- Resultados de análise de conteúdo