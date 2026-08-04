# Pulse FX

Pulse FX é um MVP para acompanhar câmbio (USD/BRL) e indicadores macroeconômicos (Selic, Fed Funds Rate) a partir de fontes públicas. O dashboard mostra o último valor e a variação de cada indicador, a tela de detalhe traz o histórico em gráfico com o intervalo de comparação configurável, é possível marcar favoritos, e um tour guiado interativo apresenta o produto na primeira visita. Este repositório foi desenvolvido em resposta ao desafio técnico full stack da Thomson Reuters, descrito em [`CHALLENGE.md`](./CHALLENGE.md).

## Demonstração

[![Pulse FX - Demonstração](https://img.youtube.com/vi/3daUy5KSOso/maxresdefault.jpg)](https://youtu.be/3daUy5KSOso)

Ou baixe o vídeo diretamente: [demonstration.mp4](./demonstration.mp4).

**Stack:** Node.js, TypeScript, Express e Prisma no backend; PostgreSQL como banco; React, TypeScript, Vite e Tailwind CSS no frontend; tudo containerizado com Docker Compose.

## Como subir o ambiente

Pré-requisitos: Docker e Docker Compose v2 (o plugin `docker compose`, versão 2.1.0 ou mais recente).

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Preencha `FRED_API_KEY` nos dois arquivos (`.env` da raiz e `backend/.env`) com uma chave gratuita obtida em https://fred.stlouisfed.org/docs/api/api_key.html.

```bash
docker compose up --build
```

Isso sobe os três serviços (Postgres, backend e frontend). As migrations do Prisma não rodam automaticamente, então depois que os containers estiverem de pé, rode em outro terminal:

```bash
docker compose exec backend yarn prisma migrate deploy
docker compose exec backend yarn prisma db seed
```

Com isso: o frontend fica em [http://localhost:5173](http://localhost:5173), a API em [http://localhost:3000](http://localhost:3000) (health check em `/health`, documentação Swagger em `/docs`). Passo a passo mais detalhado, incluindo troubleshooting, em [`HOW_TO_RUN.md`](./HOW_TO_RUN.md).

## Variáveis de ambiente

Definidas em `.env` (raiz, lido pelo Docker Compose) e `backend/.env` (usado só quando o backend roda fora do Docker):

| Variável | Descrição |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciais e nome do banco, usadas pelo serviço `postgres`. |
| `DATABASE_URL` | String de conexão do Prisma (só em `backend/.env`; no Docker Compose o backend recebe a URL já resolvida pro hostname `postgres`). |
| `PORT` | Porta em que o servidor Express do backend escuta (`3000`). |
| `FRED_API_KEY` | Chave da API do FRED, necessária pra consultar séries como `FEDFUNDS`. |
| `FRONTEND_ORIGIN` | Origem permitida via CORS no backend (o frontend). |
| `VITE_API_BASE_URL` | URL base da API usada pelo frontend. Aponta para `http://localhost:3000` (porta do backend mapeada no host), não para `http://backend:3000` (hostname interno do Compose), porque as chamadas partem do navegador do usuário, fora da rede interna do Docker. |

## Indicadores escolhidos

Três indicadores, cobrindo as duas fontes obrigatórias do desafio (BCB e FRED):

- **USD/BRL** (`usd_brl`, tipo `fx`) - BCB Olinda, série PTAX (cotação de venda). É o indicador mais natural pra um produto de câmbio, e a fonte já oferece o dado de fechamento pronto pra uso. Documentação: https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/swagger-ui3/
- **Selic** (`selic`, tipo `macro`) - BCB SGS, série 432 (meta Selic definida pelo Copom). Escolhida por ser uma série numérica direta, sem a complexidade de diferenciar mês de referência e mês de divulgação. Documentação: https://www3.bcb.gov.br/sgspub/
- **Fed Funds Rate** (`fed_funds_rate`, tipo `macro`) - FRED, série `FEDFUNDS`. Paralelo direto com a Selic (ambas são a taxa básica de juros do respectivo banco central), o que permite comparar juros Brasil x EUA lado a lado. Documentação: https://fred.stlouisfed.org/docs/api/fred/

Motivação completa de cada escolha, e demais decisões de modelagem de dados, em [`PLANNING.md`](./PLANNING.md).

## Regra de variação percentual e janela de histórico

A variação percentual compara o valor mais recente com uma referência no passado, com o intervalo dependendo do tipo de série (mesma regra aplicada no dashboard e na tela de detalhe):

- **Câmbio (`fx`):** referência é a observação de **7 dias úteis** atrás (padrão), com opção de 15 ou 30 dias úteis na tela de detalhe. Como só são armazenados dias com pregão (a PTAX não publica em fins de semana e feriados), contar posições no histórico já garante isso automaticamente.
- **Macro (`macro`):** referência é o valor de **1 mês de calendário** atrás (padrão), com opção de 3 ou 6 meses na tela de detalhe. Como Selic e Fed Funds Rate não mudam todo dia, usa-se o último dado conhecido igual ou anterior à data alvo, nunca interpolação.

O histórico exibido no gráfico (`observations`) é calculado dinamicamente a partir do intervalo de comparação escolhido, sempre com margem de contexto suficiente pra o ponto de referência não ficar colado na borda do gráfico. Regra completa, incluindo os detalhes de cálculo da janela, em [`PLANNING.md`](./PLANNING.md).

## Sincronização

Cada indicador tem sua própria política de sincronização: um TTL passivo de 60 minutos (o backend busca dado novo na fonte externa automaticamente se o dado já persistido estiver mais velho que isso) combinado com um cooldown de 30 minutos pra refresh manual (disparado pelo usuário, tanto no banner do dashboard quanto na tela de detalhe), contado a partir da última busca real, não do último clique. Essa combinação evita tanto dado desatualizado quanto chamadas descontroladas às APIs externas. Raciocínio completo em [`PLANNING.md`](./PLANNING.md).

## Como rodar o frontend web

O frontend roda exclusivamente via Docker Compose (não há fluxo separado de "rodar localmente sem Docker"), como parte do `docker compose up --build` descrito acima, acessível em [http://localhost:5173](http://localhost:5173). Ele sobe em modo de desenvolvimento dentro do container (`yarn dev --host`), não como build de produção, o que é suficiente pro escopo do MVP.

## Testes e lint

Backend (dentro de `backend/`):

```bash
yarn test
yarn lint
```

Frontend (dentro de `frontend/`, ou via `docker compose exec frontend yarn test` / `yarn lint` com o container de pé):

```bash
yarn test
yarn lint
```

Parte dos testes do backend (persistência) faz integração real com o Postgres e precisa da variável `DATABASE_URL` no ambiente; os testes do frontend são unitários/de componente, sem depender de Postgres ou backend rodando. Detalhes completos, incluindo como carregar `DATABASE_URL` pro terminal, em [`HOW_TO_RUN.md`](./HOW_TO_RUN.md).

## Decisões técnicas (resumo)

- **Estrutura do repositório:** monorepo Git único, `frontend/` e `backend/` em pastas separadas, sem workspaces compartilhados (setup mais simples, cada pasta com seu próprio `package.json`/lockfile).
- **ORM:** Prisma, pra reduzir erro em query manual e gerar migrations automaticamente dentro do prazo do desafio.
- **Favoritos:** campo `isFavorite` simples na tabela de indicadores, não uma relação usuário-indicador, porque o MVP é single-user sem autenticação.
- **Reset de demonstração:** endpoint `POST /admin/reset` (sem autenticação, pela mesma razão dos favoritos) apaga os dados sincronizados pra recomeçar a demonstração do zero.
- **Gerenciador de pacotes:** Yarn Classic em todo o projeto (frontend e backend), padronizado depois de o npm travar indefinidamente instalando o Vite 8 (motor Rolldown) nesta máquina.
- **ESLint no backend:** flat config com `typescript-eslint` recomendado, mesmo padrão já usado no frontend.

Lista completa de decisões e trade-offs, com o raciocínio por trás de cada uma, em [`PLANNING.md`](./PLANNING.md).

## Documentação adicional

- [`CHALLENGE.md`](./CHALLENGE.md): briefing original do desafio, com requisitos e critérios de avaliação.
- [`PLANNING.md`](./PLANNING.md): decisões de arquitetura, modelagem de dados e trade-offs, em detalhe.
- [`HOW_TO_RUN.md`](./HOW_TO_RUN.md): passo a passo completo pra configurar o ambiente, subir o projeto e rodar testes/lint.
- [Repositório no GitHub](https://github.com/osamucadev/pulse-fx/)
- Documentação interativa da API (Swagger): `http://localhost:3000/docs`, disponível depois de subir o projeto.
