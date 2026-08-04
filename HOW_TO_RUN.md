# Como rodar o Pulse FX

## 1. Pré-requisitos

- Docker
- Docker Compose v2 (o plugin `docker compose`, não o binário legado `docker-compose` v1), versão 2.1.0 ou mais recente, necessária para a sintaxe `depends_on.condition: service_healthy` usada no `docker-compose.yml`.

## 2. Variáveis de ambiente

O projeto usa **dois arquivos `.env` distintos**, com propósitos diferentes:

- **`.env` na raiz do repositório**: lido automaticamente pelo Docker Compose. Define `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `PORT` e `FRED_API_KEY`, que são repassados ao container do backend.
- **`backend/.env`**: usado quando o backend roda fora do Docker (ex.: `npm run dev`, ou comandos do Prisma CLI localmente). Tem as mesmas variáveis, mas com `DATABASE_URL` já resolvido para `localhost` em vez do hostname `postgres` do Docker.

Antes de subir o projeto, copie o `.env.example` para `.env` em **ambos os lugares**:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Depois, obtenha uma chave gratuita do FRED em https://fred.stlouisfed.org/docs/api/api_key.html e preencha `FRED_API_KEY` nos **dois** arquivos (`.env` da raiz e `backend/.env`).

## 3. Subindo o ambiente

Na raiz do repositório:

```bash
docker compose up --build
```

Isso sobe o Postgres e o backend.

**Importante:** hoje as migrations do Prisma **não** rodam automaticamente ao subir o container (o `CMD` do `Dockerfile` só executa `npm start`, sem nenhum passo de migration). Depois que os containers estiverem de pé, rode manualmente, em outro terminal:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

O primeiro comando aplica as migrations (cria as tabelas). O segundo popula o catálogo dos três indicadores (`usd_brl`, `selic`, `fed_funds_rate`).

## 4. Confirmando que subiu

- Health check: [http://localhost:3000/health](http://localhost:3000/health) deve responder `{ "status": "ok" }`.
- Documentação interativa (Swagger UI): [http://localhost:3000/docs](http://localhost:3000/docs).

## 5. Rodando os testes

Dentro de `backend/`:

```bash
npm test
```

Parte dos testes (os de persistência, em `*.repository.test.ts`) faz integração real com o Postgres, então precisam:

1. Do Postgres de pé (via `docker compose up -d postgres`, a partir da raiz).
2. Da variável `DATABASE_URL` disponível no ambiente onde o comando roda, já que `npm test` não carrega arquivos `.env` sozinho.

No Linux/Mac, a partir da raiz do repositório:

```bash
cd backend
set -a && source .env && set +a && npm test
```
