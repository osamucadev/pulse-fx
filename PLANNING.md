# Planejamento inicial · Pulse FX

Este documento registra o raciocínio por trás das principais decisões do projeto antes de qualquer linha de código ser escrita. A ideia é deixar claro não só o que foi escolhido, mas por que, incluindo os trade offs considerados.

## Contexto

O Pulse FX é o MVP proposto no desafio técnico full stack da Thomson Reuters. O objetivo é acompanhar câmbio (BRL) e indicadores macroeconômicos a partir de fontes públicas, com dados persistidos, API própria e cliente web.

## Persona

O produto foi pensado pra um usuário brasileiro comum que especula com câmbio de forma simples: compra dólar quando acha que o preço vai subir, espera a alta, e vende de volta pra lucrar na diferença. Não é um trader profissional nem alguém que opera com derivativos ou hedge cambial, é alguém acompanhando a cotação no dia a dia pra decidir a hora de comprar ou vender.

Essa persona serve de referência pra decisões de produto ao longo do projeto, como qual cotação da PTAX é exibida pro indicador USD/BRL (ver seção de modelagem de dados, mais abaixo).

## Estrutura do repositório

A opção foi por manter frontend e backend em pastas separadas na raiz do repositório (`/backend` e `/frontend`), sem uso de workspaces (pnpm, yarn ou npm workspaces) e sem pacote compartilhado entre eles.

Essa escolha foi feita conscientemente, mesmo sabendo que o briefing tem preferência por monorepo com pacotes compartilhados. O motivo é prático: experiências anteriores com workspaces trouxeram problemas de configuração e manutenção que não valem o ganho, principalmente considerando o prazo curto do desafio. Preferiu-se um setup mais simples, com menos partes móveis, ainda dentro de um único repositório Git (o que já atende ao espírito do monorepo pedido, mesmo sem o compartilhamento de pacotes entre front e back).

## Indicadores escolhidos

Foram escolhidos três indicadores, cobrindo as duas fontes obrigatórias:

USD/BRL, via BCB Olinda (PTAX), com atualização diária. É o indicador mais natural pra um produto de câmbio, e a fonte já oferece o dado de fechamento pronto pra uso.

Selic, via BCB SGS. Entre Selic e IPCA, a Selic foi escolhida por ser uma série numérica mais direta, sem a complexidade adicional de ter que diferenciar mês de referência e mês de divulgação, o que reduz risco de erro na regra de variação percentual.

Um indicador americano via FRED: Fed Funds Rate. Foi escolhido por ser o paralelo mais direto com a Selic, ambos são a taxa básica de juros definida pelo banco central de cada país, o que facilita a narrativa comparativa do produto (juros Brasil x EUA lado a lado).

## Persistência e ORM

O ORM escolhido foi o Prisma. A decisão levou em conta o prazo de três dias: o Prisma reduz a chance de erro em query manual, gera migrations de forma automática e deixa mais tempo disponível pra focar na regra de negócio (variação percentual, política de sincronização), que é o núcleo real do desafio.

## Política de sincronização

A estratégia definida combina duas camadas, aplicadas individualmente por indicador (não de forma global pro sistema):

Um TTL passivo (por exemplo, 1 hora): sempre que alguém acessa um indicador, o backend verifica se o dado mais recente tem mais tempo que esse TTL. Se tiver, busca dado novo na fonte externa antes de responder.

Um refresh manual, disparado pelo usuário no front, com um cooldown mínimo (por exemplo, 30 minutos) contado a partir da última busca real na fonte externa, não da última vez que o usuário clicou. Se o usuário tentar forçar antes desse tempo mínimo, o backend recusa e devolve o dado que já tem.

Essa combinação evita dois problemas ao mesmo tempo: um TTL fixo sozinho frustraria quem quer ver um dado mais recente na hora, e permitir forçar atualização sem limite geraria chamadas descontroladas às APIs externas, o que o briefing pede explicitamente pra evitar.

## Regra de variação percentual

A variação percentual de cada indicador compara o valor mais recente com um valor de referência, mas o intervalo usado como referência depende do tipo do indicador, não é um número fixo universal.

Séries de câmbio (indicador `usd_brl`, tipo `fx`): a referência é a observação de 7 dias úteis atrás, não 7 dias corridos. Como só armazenamos dias com pregão (a PTAX não publica em fins de semana e feriados), contar posições no histórico já garante isso automaticamente, sem precisar filtrar calendário à parte.

Séries macroeconômicas (indicadores `selic` e `fed_funds_rate`, tipo `macro`): a referência é o valor de 1 mês de calendário atrás. Como Selic e Fed Funds Rate não mudam todo dia (a Selic fica constante entre reuniões do Copom, por exemplo), a regra usa o último dado conhecido igual ou anterior a essa data, em vez de exigir um valor exatamente naquela data ou interpolar entre pontos, seguindo a mesma lógica de "não inventar dado que a fonte não forneceu" já usada na modelagem de observações.

Os valores acima (7 dias úteis pra FX, 1 mês pra macro) continuam sendo o default usado pelo dashboard e sempre que nenhum intervalo é escolhido. O que era registrado aqui como "nota de evolução futura" já foi implementado: `GET /indicators/:code` aceita um query param opcional `lookback` (inteiro positivo), que sobrescreve esse N por requisição, sem mudar o default nem afetar `GET /indicators` (a listagem do dashboard nunca usa esse parâmetro). Um `lookback` inválido (não numérico, zero ou negativo) retorna 400.

Na tela de detalhe do frontend, esse parâmetro é exposto como um dropdown com valores pré-definidos por tipo, em vez de um campo numérico livre: 7 (default), 15 ou 30 dias úteis pra `fx`; 1 (default), 3 ou 6 meses pra `macro`. Presets em vez de um input livre porque o objetivo é deixar o usuário comparar contra períodos que fazem sentido pro tipo de série, não digitar qualquer número arbitrário.

O cálculo da variação em si sempre usa o histórico completo já persistido pro indicador, nunca o recorte devolvido em `observations`, justamente pra um lookback maior (como 6 meses) conseguir achar uma referência válida mesmo que o gráfico exiba uma janela menor. Ainda assim, se o `lookback` escolhido for maior do que o histórico que o banco realmente tem sincronizado, a variação retorna `null`, o mesmo comportamento de "não inventar dado que a fonte não forneceu" já esperado em outros pontos da regra de variação.

### Janela de histórico retornada por `GET /indicators/:code`

O campo `observations` é sempre calculado dinamicamente a partir do lookback efetivo: o valor vindo do query param `lookback`, ou o default do `type` do indicador (7 dias úteis pra `fx`, 1 mês pra `macro`) quando o param não é enviado. Não existe mais um caminho separado que force uma janela fixa de 90 dias independente do lookback, nem quando a requisição vem sem esse parâmetro.

O motivo de não ter mais um caminho fixo: uma versão anterior dessa etapa fazia `GET /indicators/:code?lookback=6` calcular a janela dinamicamente, mas o carregamento inicial da tela de detalhe (sem `lookback` na URL ainda, antes do usuário mexer no dropdown) continuava caindo num valor fixo de 90 dias. Isso é inconsistente: a variação exibida já é calculada contra o lookback default (7 dias úteis / 1 mês) desde o primeiro carregamento, mas o gráfico mostrava uma janela de 90 dias sem relação direta com esse default, então o ponto de referência ficava perdido em algum lugar no meio de um gráfico bem mais largo do que o necessário. Unificar num único caminho, sempre a partir do lookback efetivo, resolve isso pra todos os casos (com ou sem o parâmetro) de uma vez.

A janela dinâmica é calculada em duas partes, em `dynamicHistoryWindowDays` (`backend/src/routes/indicators.route.ts`):

1. **Período mínimo necessário pra alcançar a referência** (`referenceSpanDaysFor`), convertido pra dias corridos a partir do `lookback` e do `type`:
   - `fx`: o `lookback` conta posições de dias úteis no histórico persistido (só dias de pregão são salvos), então a conversão usa a proporção padrão de 5 dias úteis por 7 dias corridos (`lookback * 7 / 5`, arredondado pra cima).
   - `macro`: o `lookback` já é em meses de calendário, convertido usando 31 dias por mês (limite superior seguro, cobre qualquer mês real).
2. **Margem de contexto**: 30% a mais sobre esse período mínimo, mais um piso fixo de 5 dias. O piso fixo existe porque só o percentual não é suficiente pra presets pequenos (o preset default de `fx`, 7 dias úteis, sem o piso ficava com só 1 observação de folga antes do ponto de referência, ainda "colado" na borda esquerda do gráfico na prática).

Essa aproximação é intencionalmente só pra dimensionar a janela de exibição, não pra calcular a variação (que, como já dito acima, usa sempre o histórico completo real, sem aproximação). Um erro de alguns dias na janela do gráfico não muda nenhum número exibido, só quanto contexto aparece ao redor do ponto de referência.

Um efeito colateral esperado: pra `lookback=6` (macro), a janela dinâmica pode pedir mais dias do que o `MACRO_SYNC_RANGE_DAYS` (200 dias) realmente tem sincronizado. Nesse caso a janela retornada simplesmente mostra todo o histórico disponível (o filtro por data não exclui nada que exista, só nada aparece antes do que foi de fato sincronizado), sem erro e sem inventar dado, na mesma linha do restante da regra de variação.

### Intervalo de busca externa na sincronização (`syncIndicator`)

Diferente da janela de exibição acima, o intervalo de dados buscado nas fontes externas a cada sincronização (`SyncRange` passado pra `syncIndicator`) precisa ser grande o bastante pra cobrir o maior `lookback` que o cálculo de variação pode receber, senão o banco nunca chega a ter dado suficiente pra uma comparação de vários meses atrás, mesmo com a lógica de cálculo correta (esse foi exatamente o bug observado ao testar o preset de 6 meses pra indicadores `macro`: `variationPercent` vinha `null` porque só havia ~90 dias de histórico persistido).

Esse intervalo é diferenciado por tipo de indicador, em vez de um único valor pra todos:

- `fx`: 90 dias. O maior preset de `lookback` oferecido no frontend pra esse tipo é 30 dias úteis (cerca de 42 dias corridos), então o intervalo já em uso segue com folga de sobra, sem necessidade de aumentar.
- `macro`: 200 dias. O maior preset de `lookback` oferecido pra esse tipo é 6 meses (cerca de 183 dias corridos), então o intervalo precisou crescer pra cobrir esse caso com margem de segurança.

A alternativa considerada foi manter um único intervalo (200 dias) pra todos os indicadores, por simplicidade de um valor só. Foi descartada porque criaria uma assimetria sem necessidade real: `fx` não usa lookback além de 30 dias úteis, então buscar mais de 2x o histórico que ele nunca vai precisar significa mais chamadas HTTP à API do BCB (mesmo que dentro do mesmo request de sync) e mais linhas persistidas sem propósito. Diferenciar por tipo aqui segue o mesmo raciocínio já usado na regra de variação em si (fx e macro já têm unidades de comparação diferentes), então não é uma complexidade nova sendo introduzida, é a mesma diferenciação por tipo se estendendo pra mais um ponto do sistema.

## Modelagem de dados

Foram desenhadas duas tabelas.

A tabela `indicators` guarda tanto o catálogo dos indicadores (código, nome, fonte, tipo, descrição) quanto o estado de controle de sincronização (última busca real, TTL em minutos, cooldown de refresh em minutos). A decisão de colocar esse controle de sync como colunas na própria tabela, ao invés de uma tabela separada, foi por simplicidade: a relação é sempre um para um, não existe necessidade de histórico de tentativas de sincronização, e criar uma tabela separada pra esse caso seria engenharia especulativa pra um problema que ainda não existe. Fica documentado aqui que essa escolha prioriza um código enxuto e adequado ao escopo real do MVP, sem tentar antecipar evoluções futuras que não foram pedidas.

A tabela `indicator_observations` guarda o histórico completo de valores de cada indicador ao longo do tempo, vinculada à tabela `indicators` por chave estrangeira. Cada observação tem sua própria data de referência (a data do dado em si, não a data em que foi consultado ou salvo) e seu valor. Existe uma restrição de unicidade entre indicador e data de referência, pra evitar duplicidade caso a sincronização rode mais de uma vez por engano.

O campo de valor será do tipo decimal, não float, justamente pra evitar os erros de arredondamento que número de ponto flutuante binário costuma introduzir em dado financeiro.

O histórico completo guardado desde o início também permite montar o gráfico de evolução na tela de detalhe de cada indicador, prevista no briefing.

## Decisão: cotação de venda como valor do indicador USD/BRL

A API PTAX do Banco Central retorna duas cotações por dia útil: `cotacaoCompra` e `cotacaoVenda`. Para o campo `IndicatorObservation.value` do indicador `usd_brl`, foi escolhido persistir a cotação de venda (`sellRate`), não a de compra (`buyRate`).

Dois motivos levaram a essa escolha. Primeiro, a cotação de venda é a que aparece no noticiário e no senso comum quando alguém fala "o dólar está a R$X", é o número com que o usuário já está familiarizado. Segundo, e mais importante à luz da persona descrita acima, é exatamente o preço que ela acompanha: o valor pelo qual consegue vender o dólar que já possui, ou seja, o número relevante pra decidir a hora de realizar o lucro.

A cotação de compra (`buyRate`) continua disponível no retorno de `fetchUsdBrlRates` (não foi descartada do client), caso um dia faça sentido expor as duas cotações no produto. Nessa versão do MVP, porém, só a cotação de venda é persistida.

## Decisão: favoritos como campo booleano no indicador

"Meus indicadores" (favoritos) foi implementado como um campo `isFavorite` direto na tabela `indicators`, não como uma tabela de relação entre usuário e indicador.

Essa escolha só faz sentido porque o MVP é single-user, sem autenticação (fora de escopo, conforme o briefing). Não existe "de quem" é o favorito, existe um único usuário implícito usando o sistema. Criar uma tabela de relação usuário-indicador agora seria engenharia especulativa pra um conceito de usuário que ainda não existe no sistema.

Se autenticação for adicionada no futuro, esse campo precisaria ser repensado como uma relação (ex: tabela `user_favorite_indicators`, com chave composta usuário + indicador), já que múltiplos usuários teriam suas próprias listas de favoritos.

## Decisão: Yarn Classic em vez de npm no frontend

O scaffold do frontend (Vite + React + TypeScript) usa Yarn Classic (v1.22.22) como gerenciador de pacotes, não npm. Essa escolha vale só pra pasta `frontend/`, o backend continua normalmente com npm, cada pasta com seu próprio gerenciador, sem workspace compartilhado entre eles (ver seção de estrutura do repositório, mais acima).

O motivo é técnico, não uma preferência arbitrária. A versão atual do Vite (8.x) usa o Rolldown como motor de bundling, que declara binários nativos para várias plataformas como `optionalDependencies` no `package.json`. Isso faz o processo de instalação disparar um número grande de requisições pequenas ao registry, uma por combinação de plataforma/arquitetura. Com `npm create vite@latest`, essa instalação travava indefinidamente, sem erro, sem timeout, só nunca terminava. `curl` e `npm ping` confirmaram que a rede e o registry estavam saudáveis, então o problema era específico de como o cliente do npm lida com esse volume de `optionalDependencies` do Rolldown, não da rede em si.

Trocando para Yarn Classic, com `yarn create vite . --template react-ts`, a mesma instalação completou em segundos, sem travar. Por isso, todo comando de instalação dentro de `frontend/` deve usar `yarn` (`yarn add`, `yarn install`), nunca `npm`.

## Decisão: frontend containerizado em modo dev

O serviço `frontend` no `docker-compose.yml` roda `yarn dev --host` dentro do container, servindo a aplicação via Vite dev server, não um build de produção (`vite build` + servidor estático). Essa escolha prioriza simplicidade e é adequada ao escopo do MVP: um único `docker compose up --build` sobe os três serviços (Postgres, backend e frontend) prontos pra avaliação, sem precisar de um segundo Dockerfile ou estágio de build separado só pra servir arquivos estáticos. A flag `--host` é necessária pro Vite aceitar conexões vindas de fora do container (por padrão ele só escuta em `localhost` dentro do próprio container).

Uma nuance importante é a variável `VITE_API_BASE_URL`, que precisa apontar para `http://localhost:3000`, a porta do backend mapeada no host, e não para `http://backend:3000`, o hostname interno da rede do Docker Compose. Isso acontece porque as chamadas à API partem do navegador do usuário, que roda fora da rede interna do Compose, então o hostname `backend` (resolvido só entre containers) não é alcançável a partir do browser. Essa variável é definida no `.env` da raiz e repassada ao serviço `frontend`, seguindo o mesmo padrão já usado para `PORT` e `FRED_API_KEY` no serviço `backend`.

O serviço `frontend` também monta `./frontend:/app` como bind mount, com `/app/node_modules` como volume anônimo separado por cima (pra não deixar o `node_modules` do host, se existir, sobrescrever o que foi instalado dentro da imagem). Isso permite que edições feitas localmente em `frontend/` sejam vistas pelo Vite dev server rodando no container e disparem hot reload, sem precisar de rebuild da imagem a cada mudança. Rebuild só é necessário quando `package.json` ou `yarn.lock` mudam (nova dependência).

## Decisão: endpoint `POST /admin/reset` sem autenticação

Foi adicionado um endpoint `POST /admin/reset`, que apaga todas as observações persistidas (`IndicatorObservation`) e limpa `lastSyncedAt` de todos os indicadores, devolvendo o sistema a um estado equivalente ao logo após o seed (catálogo presente, nenhum dado sincronizado ainda).

Esse endpoint existe exclusivamente para fins de demonstração e teste do MVP, por exemplo pra resetar o estado antes de gravar um vídeo de demonstração ou antes de uma nova avaliação, sem precisar derrubar o banco e rodar migration/seed manualmente de novo. Ele é disparado pelo botão "Reiniciar teste" no rodapé do frontend.

Assim como a decisão já registrada sobre favoritos, esse endpoint não tem autenticação nem qualquer proteção porque o projeto inteiro é single-user, sem conceito de usuário autenticado (fora de escopo, conforme o briefing). Fica registrado aqui, de forma explícita, que um endpoint como esse, capaz de apagar dados em massa sem confirmação além da do próprio cliente, jamais deveria existir sem controle de acesso adequado (autenticação, autorização, e provavelmente nem deveria estar acessível publicamente) em um sistema real de produção. Ele é aceitável aqui apenas porque o escopo do desafio é um MVP de demonstração, não um produto em produção com dados de usuários reais.

## Decisão: Vitest e Testing Library para testes do frontend

O frontend usa Vitest como test runner, integrado nativamente ao Vite (mesma configuração, mesmo motor de transformação, sem precisar de um segundo bundler só pra rodar testes), junto com Testing Library (`@testing-library/react`) pra renderizar componentes e fazer asserções sobre o DOM em vez de detalhes de implementação. Uma particularidade técnica fica registrada aqui: as versões mais recentes de `jsdom` (26 em diante) e `@testing-library/jest-dom` (7 em diante) exigem Node 22 ou mais recente, mas a imagem Docker do frontend usa `node:20-alpine`, mesma versão já usada no backend, por consistência. Por isso, essas duas dependências foram fixadas em versões específicas compatíveis com Node 20 (`jsdom@26.0.0` e `@testing-library/jest-dom@6.9.1`), em vez de usar a faixa mais recente, evitando o mesmo tipo de incompatibilidade de engine já visto antes neste projeto com dependências desalinhadas.

## Decisão: tour guiado com react-joyride

O Pulse FX tem um tour guiado, implementado com `react-joyride` (versão 3.x, a única major da lib com suporte a React 19), cruzando o Dashboard e a tela de detalhe de um indicador fixo (`usd_brl`) na mesma sequência de passos.

### Modo controlado

O Joyride roda em modo controlado (prop `stepIndex`, em vez de deixar a lib gerenciar seu próprio índice internamente), porque parte dos passos do tour vive em rotas diferentes: o Dashboard, em `/`, e a tela de detalhe, em `/indicators/usd_brl`. Sem modo controlado, a lib não tem como disparar uma navegação de rota real entre um passo e o próximo. O componente `TourGuide` só passa `run={true}` pro Joyride quando a rota atual já bate com a rota do passo ativo; se não bater, ele navega primeiro (via `useNavigate` do react-router) e mantém o Joyride pausado até a página certa estar renderizada. A espera pelo elemento alvo realmente existir no DOM depois da navegação, e do carregamento assíncrono dos dados na tela de detalhe, usa o mecanismo nativo `targetWaitTimeout` do próprio Joyride, sem precisar de polling manual no DOM.

### Passos condicionais e larguras do tour

O tour tem 10 passos fixos e 2 passos condicionais, os dois controlados pela mesma condição: existe algum indicador com `lastValue` null (nunca sincronizado)? Se sim, entra o passo do banner de sincronização, logo depois do grid de cards, explicando o "Sem dados" e o botão "Sincronizar agora"; e entra também o passo final, de volta no Dashboard, apontando pra um segundo card (Selic) e explicando que a sincronização é feita indicador por indicador, não em massa. Se não houver nenhum dado faltando, os dois passos são omitidos.

As duas condições foram unificadas numa só de propósito. Na primeira versão, o passo do banner e o passo final tinham condições independentes (banner: qualquer indicador sem dado; passo final: o Selic especificamente sem dado), o que criava um terceiro caminho possível de 11 passos nos casos em que o Selic já estivesse sincronizado mas outro indicador não. Esse caminho intermediário não agregava nada à experiência, existia só por acidente de como as duas condições foram escritas separadamente, então foram unificadas numa condição só. Com isso, o tour sempre tem exatamente 10 passos (tudo já sincronizado) ou 12 (algo ainda não sincronizado), nunca 11.

A lista de passos é montada uma vez, no momento em que o tour começa a rodar (a transição de `run: false` pra `true`), e fica congelada durante toda a execução, mesmo que o usuário sincronize algum indicador no meio do tour. Isso evita que o número de passos ou os índices mudem embaixo do usuário enquanto ele navega.

### Início automático e revisitar

Na primeira visita à aplicação, o tour começa sozinho, controlado por uma chave no `localStorage` (`pulse-fx-tour-seen`). O início automático espera os dados dos indicadores terminarem de carregar antes de calcular a lista de passos, pra que a filtragem condicional já funcione corretamente desde a primeira execução, sem depender de um segundo carregamento.

O botão "Revisitar tour", no rodapé, permite rodar o tour de novo a qualquer momento, reiniciando do passo 0 e reavaliando as condições com os dados atuais. Por isso a mesma sessão pode ver o tour de 12 passos numa primeira execução, e de 10 passos numa execução seguinte, depois de sincronizar tudo.

## Decisão: ESLint no backend

O backend usa ESLint com `typescript-eslint`, no formato flat config (`eslint.config.js`), mesmo padrão já usado no frontend. A configuração usa `js.configs.recommended` e `tseslint.configs.recommended` (o preset padrão, sem o type-checked, que exigiria apontar pro `tsconfig.json` e deixaria o lint mais lento) sem regras adicionais de estilo, evitando ruído cosmético num projeto que já não tinha lint configurado até agora. O diretório `src/generated` (cliente Prisma gerado automaticamente) fica de fora do lint, por não ser código escrito à mão. Rodado contra o código existente, não encontrou nenhum problema real, então nenhuma correção de código foi necessária além da configuração em si.

## Pontos em aberto

Não há pendências de decisão no momento. Se surgir alguma durante a implementação, este documento será atualizado.
