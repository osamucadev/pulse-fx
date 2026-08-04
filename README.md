# Pulse FX

Pulse FX é um MVP para acompanhar câmbio (USD/BRL) e indicadores macroeconômicos (Selic, Fed Funds Rate) a partir de fontes públicas. O dashboard mostra o último valor e a variação de cada indicador, a tela de detalhe traz o histórico em gráfico com o intervalo de comparação configurável, é possível marcar favoritos, e um tour guiado interativo apresenta o produto na primeira visita. Este repositório foi desenvolvido em resposta ao desafio técnico full stack da Thomson Reuters, descrito em CHALLENGE.md.

**Stack:** Node.js, TypeScript, Express e Prisma no backend; PostgreSQL como banco; React, TypeScript, Vite e Tailwind CSS no frontend; tudo containerizado com Docker Compose.

- [`CHALLENGE.md`](./CHALLENGE.md): briefing original do desafio, com requisitos e critérios de avaliação.
- [`PLANNING.md`](./PLANNING.md): decisões de arquitetura, modelagem de dados e trade-offs considerados durante a implementação.
- [`HOW_TO_RUN.md`](./HOW_TO_RUN.md): como configurar o ambiente, subir o projeto e rodar os testes.
- [Repositório no GitHub](https://github.com/osamucadev/pulse-fx/)
- Documentação interativa da API (Swagger): `http://localhost:3000/docs`, disponível depois de subir o projeto (ver `HOW_TO_RUN.md`).
