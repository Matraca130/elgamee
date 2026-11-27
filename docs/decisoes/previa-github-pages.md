# Manter um endereço fixo para a prévia jogável

**Aceita · registrada em 27 de novembro de 2026**

O GitHub é a origem do código e das decisões. As mudanças passam por pull requests para `main`. O GitHub Pages usa a branch `gh-pages` para servir uma cópia jogável no mesmo endereço. A prévia salva o progresso no navegador.

## Ativar a prévia

Em **Settings → Pages**, escolha **Deploy from a branch**, selecione `gh-pages` e **/ (root)**, e salve. Depois do primeiro deploy, abra a [prévia jogável do Atlas Viral](https://matraca130.github.io/elgamee/). [Configuração do GitHub Pages](https://github.com/Matraca130/elgamee/settings/pages)

## Atualizar a versão jogável

1. A partir da revisão do código escolhida para a prévia, execute `node scripts/exportar-pages.mjs <diretório-de-saída>` em uma pasta de saída vazia. O exportador prepara os arquivos estáticos com progresso local.
2. Atualize uma cópia da branch `gh-pages` com a saída. Mantenha `.nojekyll` e grave em `versao.json` o SHA completo da revisão de origem no campo `sourceCommit`.
3. Envie um commit normal para a branch para disparar a publicação. Confira `versao.json` no endereço público e abra uma arena. Cada publicação atualiza o conteúdo que já está no mesmo link.
