# Fluxo de deploy

## Ambientes

- **main**: Staging/Homologação conectado ao Cloudflare Pages: https://finmonth.pages.dev
- **production**: ambiente oficial publicado no GitHub Pages: https://finmonth.github.io

## Fluxo diário

1. Desenvolver e testar as alterações na branch **main**.
2. Validar o comportamento no ambiente Cloudflare Pages de Staging/Homologação.
3. Quando estiver estável, abrir um Pull Request de **main** para **production**.
4. Após a aprovação, fazer o merge para **production** para publicar a versão oficial.

## Regra importante

O ambiente de Staging/Homologação deve ser usado para validar as alterações antes da publicação oficial. Não fazer alterações diretamente no ambiente de produção.
