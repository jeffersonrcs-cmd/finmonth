# FinMonth

Criar Aplicativo de Controle Financeiro Pessoal

Desenvolva um aplicativo moderno, responsivo e intuitivo para controle financeiro pessoal mensal.

Objetivo

Permitir que o usuário organize suas finanças por mês, registrando receitas, contas a pagar e valores guardados, com cálculo automático de saldos e opção de reutilizar contas do mês anterior.

---

Estrutura Principal

O aplicativo deve ser organizado por meses.

Cada mês deve possuir:

Receitas

Contas

Valores guardados

Resumo financeiro

O usuário deve conseguir navegar entre todos os meses cadastrados.

---

Receitas

Permitir cadastrar receitas contendo:

Descrição

Valor

Data

Funcionalidades:

Adicionar receita

Editar receita

Excluir receita

---

Contas

Permitir cadastrar contas contendo:

Descrição

Valor

Dia de vencimento

Status (Paga ou Pendente)

Recorrente (Sim ou Não)

Funcionalidades:

Adicionar conta

Editar conta

Excluir conta

Marcar como paga

Marcar como pendente

Exibir visualmente:

Contas pagas

Contas pendentes

Contas vencidas

---

Economia

Permitir registrar valores guardados.

Cada registro deve conter:

Descrição

Valor

Funcionalidades:

Adicionar valor guardado

Editar valor guardado

Excluir valor guardado

---

Cálculos Automáticos

Total de Receitas:

Somar todas as receitas cadastradas no mês.

Total de Contas:

Somar todas as contas cadastradas no mês.

Saldo do Mês:

Saldo do Mês = Total de Receitas - Total de Contas

Total Guardado:

Somar todos os registros de economia.

Saldo Disponível:

Saldo Disponível = Saldo do Mês - Total Guardado

Todos os cálculos devem ser atualizados automaticamente sempre que houver alteração nos dados.

---

Dashboard

Na tela principal exibir cards com:

Total de Receitas

Total de Contas

Contas Pagas

Contas Pendentes

Total Guardado

Saldo do Mês

Saldo Disponível

Utilizar cores para facilitar a visualização:

Verde para valores positivos

Vermelho para despesas

Azul para economia

Amarelo para alertas de vencimento

---

Copiar Contas do Mês Anterior

Ao criar um novo mês, exibir um botão:

Adicionar Contas do Mês Anterior

Ao clicar:

Copiar todas as contas do mês anterior marcadas como recorrentes.

Manter descrição, valor e dia do vencimento alterando só o mês

Definir todas as contas copiadas como pendentes.

Permitir editar ou excluir qualquer conta copiada.

Essa funcionalidade deve reduzir o trabalho de cadastro mensal.

Opção de copiar receitas também

---

Histórico

Permitir:

Visualizar meses anteriores.

Consultar receitas, contas e economias antigas.

Manter histórico permanente.

---

Gráficos

Adicionar gráficos para:

Receitas x Despesas

Evolução do Saldo Mensal

Total Guardado por Mês

---

Interface

Criar interface moderna e limpa utilizando:

Design responsivo para celular e desktop.

Tema claro e tema escuro.

Layout simples e intuitivo.

Navegação rápida entre meses.

---

Armazenamento

Salvar todos os dados localmente ou em banco de dados persistente.

Os dados não devem ser perdidos ao fechar o aplicativo.

---

Tela Inicial

A tela principal deve apresentar imediatamente:

💰 Total Receitas
📄 Total Contas
✅ Contas Pagas
⏳ Contas Pendentes
🏦 Total Guardado
📈 Saldo do Mês
💵 Saldo Disponível

Além da lista completa de contas do mês atual

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/25c9ffad-0051-42b2-98f1-edfdb568819a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
