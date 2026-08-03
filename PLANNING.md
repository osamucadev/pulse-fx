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

Um indicador americano via FRED (ainda a definir qual exatamente, entre opções como Fed Funds Rate ou CPI). Essa escolha final ainda está em aberto e será fechada durante a implementação da integração com o FRED.

## Persistência e ORM

O ORM escolhido foi o Prisma. A decisão levou em conta o prazo de três dias: o Prisma reduz a chance de erro em query manual, gera migrations de forma automática e deixa mais tempo disponível pra focar na regra de negócio (variação percentual, política de sincronização), que é o núcleo real do desafio.

## Política de sincronização

A estratégia definida combina duas camadas, aplicadas individualmente por indicador (não de forma global pro sistema):

Um TTL passivo (por exemplo, 1 hora): sempre que alguém acessa um indicador, o backend verifica se o dado mais recente tem mais tempo que esse TTL. Se tiver, busca dado novo na fonte externa antes de responder.

Um refresh manual, disparado pelo usuário no front, com um cooldown mínimo (por exemplo, 30 minutos) contado a partir da última busca real na fonte externa, não da última vez que o usuário clicou. Se o usuário tentar forçar antes desse tempo mínimo, o backend recusa e devolve o dado que já tem.

Essa combinação evita dois problemas ao mesmo tempo: um TTL fixo sozinho frustraria quem quer ver um dado mais recente na hora, e permitir forçar atualização sem limite geraria chamadas descontroladas às APIs externas, o que o briefing pede explicitamente pra evitar.

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

## Pontos em aberto

Ainda falta decidir qual indicador específico do FRED será usado, e os detalhes finos de nomenclatura das rotas da API. Esses pontos serão fechados durante a implementação e, se necessário, este documento será atualizado.
