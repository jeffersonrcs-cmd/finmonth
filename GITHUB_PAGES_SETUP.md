# Como publicar o FinMonth no domínio gratuito finmonth.github.io

O GitHub Pages permite que qualquer usuário ou organização publique gratuitamente um site com endereço `seunome.github.io` ou uma organização chamada `finmonth` publicar diretamente em `https://finmonth.github.io`.

---

### Opção 1: Domínio exato `https://finmonth.github.io`

Para o domínio ser exatamente **`finmonth.github.io`**, o GitHub exige que o nome de usuário ou organização seja `finmonth`:

1. No GitHub, crie uma organização ou conta chamada **`finmonth`** (ou renomeie se estiver disponível).
2. Crie um repositório público chamado exatamente **`finmonth.github.io`**.
3. Suba o código do app para a branch `main`.
4. Vá em **Settings > Pages**:
   - Em **Build and deployment > Source**, selecione **GitHub Actions**.
5. O workflow já configurado em `.github/workflows/deploy.yml` fará o build e deploy automaticamente em poucos segundos!

---

### Opção 2: Com o seu usuário pessoal do GitHub (Ex: `jeffersonrcs.github.io/finmonth`)

Se o seu usuário for, por exemplo, `jeffersonrcs`:
1. Crie o repositório com o nome `finmonth` na sua conta.
2. Em **Settings > Pages**, selecione **GitHub Actions**.
3. Seu app ficará no ar em `https://jeffersonrcs.github.io/finmonth` (ou se você criar o repositório `jeffersonrcs.github.io`, o app ficará direto na raiz).

---

### Configuração no Supabase (Importante para Login e Confirmação de E-mail)

Para o login e redefinição de senha funcionarem no novo domínio:
1. Acesse o seu painel do **Supabase** do projeto.
2. Vá em **Authentication > URL Configuration**.
3. Em **Redirect URLs**, adicione:
   - `https://finmonth.github.io/**`
   - `https://*.github.io/**`
4. Salve as alterações.
