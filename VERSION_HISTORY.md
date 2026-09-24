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
