## v1.13.0 — PWA completo, sincronização offline com fila e notificações nativas

- adicionado suporte completo a Progressive Web App (PWA) com `manifest.json`, ícones de alta resolução e Service Worker (`sw.js`);
- implementada sincronização resiliente offline: alterações feitas sem conexão entram em fila e sincronizam automaticamente assim que a internet volta;
- adicionado suporte a Notificações Nativas do dispositivo para contas vencidas e a vencer no dia;
- adicionadas configurações e botão de teste de notificação do dispositivo em Perfil > Notificações;
- adicionado botão para instalar o FinMonth na tela de início em Configurações > Versão;
- suporte multilíngue (Português, Inglês e Espanhol) para todos os novos recursos de PWA e alertas nativos.

## v1.12.15 — tratamento de sincronização JWT e correção de chaves nos gráficos

- adicionado retry automático e tolerância a pequenos desvios de relógio do cliente (`PGRST303 — JWT issued at future`);
- evitada a desconexão abrupta do usuário caso o Supabase reporte atraso de validação de token;
- adicionada propriedade `key` única para elementos customizados `dot` e `activeDot` do componente `Line` (evitando avisos do React 19 / Recharts);
- garantida a persistência segura local e em nuvem.

## v1.12.11 — sincronização da árvore de rotas

- registrada a rota `/confirmar-email` na árvore gerada do TanStack Router;
- sincronizados os tipos e os filhos da árvore de rotas com a tela de confirmação de e-mail;
- mantido o fluxo existente de autenticação e redefinição de senha.

## v1.12.10 — correção de inicialização e sincronização

- reestruturada a identificação das rotas públicas de autenticação no componente raiz;
- removida a expressão compacta da inicialização das rotas públicas para evitar problemas de parsing no ambiente de preview;
- mantido o acesso público às telas de confirmação de e-mail e redefinição de senha.

## v1.12.8 — correção do carregamento do aplicativo

- corrigido erro de sintaxe no componente raiz que impedia a inicialização do aplicativo;
- restaurado o render das rotas públicas de confirmação de e-mail e redefinição de senha para usuários não autenticados.

## v1.12.7 — confirmação de e-mail e melhorias de autenticação

- telas de login e cadastro mantêm o idioma selecionado em Português, Inglês e Espanhol;
- cadastro agora direciona o usuário para a tela de confirmação de e-mail;
- criada a tela pública de confirmação de e-mail;
- adicionada opção para reenviar o e-mail de confirmação;
- configurado o redirecionamento de confirmação para `https://finmonth.lovable.app/confirmar-email`.

## v1.12.5 — ajustes nas notificações de contas vencidas

- notificações de contas vencidas agora informam há quantos dias a conta está vencida;
- a mensagem respeita Português, Inglês e Espanhol;
- o detalhe da conta agora mostra a data completa de vencimento, com dia, mês e ano conforme o idioma selecionado.

## v1.12.4 — central de notificações com detalhes da conta

- clicar em uma notificação agora abre uma janela suspensa com os detalhes da conta;
- contas de meses anteriores permanecem associadas ao mês correto;
- adicionada opção para **marcar como paga** diretamente na janela;
- adicionada opção de **voltar** sem realizar nenhuma ação;
- removida a navegação automática para a lista de contas do mês atual.

## v1.12.3 — correção da central de notificações

- o botão de sino do cabeçalho agora abre diretamente a **Central de notificações**;
- a tela de configuração de notificações continua acessível pelas configurações da conta.

## v1.12.2 — tradução dos filtros do histórico mensal

- filtros de período do **Histórico mensal** agora usam as traduções do idioma selecionado;
- adicionadas traduções para português, inglês e espanhol.

## v1.12.0 — evolução visual do gráfico de saldo

- **Evolução do Saldo** continua em linha, agora com cor dinâmica conforme o saldo;
- trechos positivos usam verde e trechos negativos usam vermelho;
- a troca de cor acompanha exatamente a passagem pelo valor zero;
- adicionada linha de referência em **R$ 0**;
- preenchimento suave e de baixa opacidade acompanha a cor do saldo;
- pontos atuais e pontos selecionados receberam maior destaque visual.

## v1.11.10 — refinamento dos rótulos do histórico mensal

- ajustados os filtros para **3 meses, 6 meses, 12 meses e Acima de 12 meses**;
- mantido o layout em quatro colunas, sem barra de rolagem horizontal.

## v1.11.9 — ajuste dos filtros do histórico mensal

- removida a barra de rolagem horizontal dos filtros de período do histórico mensal;
- abreviados os rótulos para **Últimos 3 m, Últimos 6 m, Últimos 12 m e Mais que 12 m**;
- filtros reorganizados em quatro colunas para caberem na largura disponível, inclusive em telas menores.

## v1.11.7 — filtros do histórico mensal

- substituídos os filtros **Todos, Receitas, Contas e Saldo do mês** por períodos de histórico;
- adicionados **Últimos 3 meses, Últimos 6 meses, Últimos 12 meses e Mais que 12 meses**;
- o histórico mensal passa a mostrar sempre os três indicadores financeiros em cada mês;
- meses com mais de 12 meses ficam disponíveis separadamente na opção **Mais que 12 meses**.

## v1.11.6 — correção do período de análise

- gráficos e indicadores principais agora usam o mês atual do sistema como limite máximo;
- meses futuros permanecem disponíveis para planejamento, mas não entram como referência principal das análises;
- **Comparação Mensal** passa a comparar sempre o mês atual com o mês imediatamente anterior;
- removido o filtro de 3, 6 e 12 meses da Comparação Mensal;
- filtros de 3, 6 e 12 meses permanecem somente nos três gráficos históricos e ignoram meses futuros.

## v1.11.5 — filtro de período na comparação

- adicionado o filtro visual de 3, 6 e 12 meses ao card **Comparação de período**;
- utilizado o mesmo padrão visual e comportamento dos filtros dos gráficos;
- seleção sincronizada com os demais gráficos da tela, mantendo uma única referência de período.

## v1.11.3 — refinamento visual dos gráficos

- filtros de período de 3, 6 e 12 meses agora são idênticos e sincronizados nos três gráficos;
- adicionada escala de valores no eixo Y e leitura monetária mais clara;
- tooltips passaram a apresentar os principais valores do mês, incluindo o saldo;
- mês atual recebe destaque visual nos gráficos;
- evolução do saldo recebeu linha mais destacada, área suave e ponto ativo mais evidente;
- barras, espaçamentos, contraste e hierarquia visual foram refinados sem alterar a estrutura ou adicionar novos gráficos e funcionalidades.

## v1.11.0 — evolução completa do histórico\n\n- reorganizada a hierarquia da tela de histórico com título, subtítulo e navegação mais claros;\n- adicionada visão de resumo com saldo atual, total recebido e total gasto;\n- adicionada comparação com o período anterior;\n- histórico mensal recebeu filtros por categoria e seleção de ano;\n- cards mensais agora são expansíveis para visualizar receitas, contas e valores guardados do período;\n- mantida a seleção de 3, 6 ou 12 meses no gráfico de evolução do saldo, com limite máximo de 12 meses;\n- melhorias aplicadas sem remover os gráficos e dados existentes.\n\n## v1.10.0 — período do gráfico de evolução\n\n- adicionada seleção de **3, 6 ou 12 meses** no gráfico de evolução do saldo;\n- o gráfico limita a visualização a no máximo **12 meses**;\n- seleção inicial em 6 meses para manter a leitura mais compacta;\n- controles responsivos e acessíveis, mantendo os demais gráficos e dados históricos intactos.\n\n## v1.9.3 — ajuste do cabeçalho de contas

- alterado o título da seção inicial para **Contas do mês**;
- movido **Ver histórico completo** para a mesma linha do título, no lado oposto;
- ajuste aplicado mantendo o comportamento e a responsividade existentes.

## v1.9.0 — seleção de moeda de exibição

- adicionadas as moedas BRL, USD e EUR em Configurações > Linguagem;
- valores financeiros continuam armazenados na base original em BRL;
- a moeda escolhida é salva somente no dispositivo, sem ocupar espaço adicional no Supabase;
- valores exibidos são convertidos pela cotação mais recente disponível;
- cotação em cache local por até 12 horas para reduzir chamadas externas;
- labels de valores acompanham a moeda selecionada.

# Histórico de versões do FinMonth

Este arquivo registra os marcos de versão do projeto e evita perder o contexto das mudanças feitas durante o desenvolvimento.

## v1.0.0

Versão inicial do FinMonth.

## v1.1.0 — evolução financeira

Marco reconstruído a partir do histórico de desenvolvimento, reunindo a primeira grande evolução funcional do aplicativo:

- gráficos e visão mensal/anual;
- visão geral e insights financeiros;
- melhorias no gerenciamento de contas;
- notificações de contas e contador de avisos;
- configurações da conta;
- preferências de notificações;
- exclusão de conta;
- melhorias de navegação e experiência.

Principais commits de referência:

- `303ef7a` — visão mensal dos gráficos;
- `71be8e3` — visão anual;
- `b9b74d7` — alternância mensal/anual;
- `e40366a` — avisos de contas;
- `aa5b082` — contador de notificações.

## v1.2.0 — identidade e autenticação

Marco reconstruído a partir das funcionalidades posteriores:

- recuperação e redefinição de senha;
- melhorias na tela de login;
- configurações de usuário e tema;
- correções de compatibilidade com Safari/iPhone;
- atualização automática da aplicação;
- renomeação oficial para FinMonth;
- marca d'água e identidade visual.

Principais commits de referência:

- `ab95e2d` — melhorias do login;
- `022f7ca` — nova senha;
- `33d250b` — fluxo de recuperação;
- `0480adb` — atualização no iPhone;
- `6f5a47f` — renomeação para FinMonth.

## v1.3.0 — versionamento e build

Marco reconstruído, consolidando:

- versão semântica do aplicativo;
- identificador único de build;
- tela de informações da versão;
- versão exibida na interface;
- automação de incremento de versão;
- publicação automática baseada no tipo de mudança.

## v1.3.1 — estabilização do versionamento

Primeiro patch após a criação do sistema automático de versões, consolidando o fluxo de publicação e o histórico reconstruído.

## v1.8.16 — tradução completa revisada

- corrigidos formulários de contas, receitas e valores guardados em English;
- labels de descrição, valor, moeda, vencimento e dia agora respeitam o idioma selecionado;
- botões de salvar/cancelar e telas secundárias de Configurações revisados;
- histórico completo e cards históricos traduzidos;
- autenticação e recuperação de senha revisadas;
- FinAI revisada para interface e mensagens de erro no idioma selecionado;
- Edge Function da FinAI atualizada para localizar respostas e mensagens de erro;
- preferência de idioma continua somente no dispositivo, sem armazenamento adicional no Supabase.

## v1.8.7 — tradução completa

- interface completa traduzida para Português, English e Español;
- formulários, histórico, notificações, configurações e estados globais adaptados ao idioma selecionado;
- moeda e nomes dos meses formatados conforme o locale selecionado;
- FinAI recebe o idioma selecionado e responde nesse idioma;
- preferência continua armazenada somente no dispositivo.

## v1.7.0 — idiomas

- opção **Linguagem** dentro de Configurações;
- seleção entre Português, English e Español;
- preferência de idioma salva somente no dispositivo, sem consumo de armazenamento do Supabase;
- detecção inicial do idioma do navegador/dispositivo quando não existe preferência salva;
- atualização do idioma da interface principal e do atributo \`lang\` do documento.

## v1.5.0 — atualização do aplicativo

- botão **Atualizar aplicativo** dentro de Configurações > Versão;
- recarga com cache-busting para abrir a publicação mais recente no Safari/iPhone instalado como app;
- verificação automática contínua de nova Build ID já publicada.

## v1.4.0 — FinAI

Nova central de inteligência financeira do FinMonth:

- substituição da aba Gráficos pela aba FinAI;
- perguntas e sugestões sobre receitas, contas, saldo e valores guardados;
- geração de gráficos mensal, comparativo e anual dentro da conversa;
- análises baseadas nos dados financeiros já registrados no aplicativo.

## Regra a partir da v1.3.1

- correção/ajuste: **patch**;
- nova funcionalidade: **minor**;
- mudança incompatível: **major**.

A Build ID continua independente da versão e identifica cada compilação individual.

> Os marcos v1.1.0 e v1.2.0 são reconstruções históricas baseadas nos commits reais do repositório. Eles não representam releases que tenham sido publicadas separadamente na época. A partir da v1.3.1, o versionamento passa a ser controlado pelo workflow do repositório.
