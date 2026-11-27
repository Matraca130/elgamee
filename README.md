# Atlas Viral

Jogo de virologia com cursos interativos de influenza e vírus sincicial respiratório. O código da arena e das fichas está em `dist/`. O servidor do site e o progresso por conta estão em `worker/`.

## Rodar e revisar

Com Node.js instalado, execute `npm run dev` e abra a URL exibida. Na prévia local, o avanço fica no navegador. Execute `npm run build` para gerar o Worker que serve o jogo e o progresso por conta no site.

Abra `/estudio-influenza.html` na prévia para testar a versão articulada da influenza. O [guia de animação](docs/prototipo-influenza.md) explica como adaptar as peças e os movimentos para outro personagem.

Para continuar em outro chat ou editor, abra o repositório na raiz e consulte as [instruções do projeto](AGENTS.md). O [registro de decisões](docs/decisoes/README.md) explica as escolhas que ainda orientam o código.

## Recuperar contexto

Abra o projeto na raiz em qualquer editor ou assistente com acesso ao código. Para preparar a busca por significado, instale o [uv](https://docs.astral.sh/uv/getting-started/installation/) e execute uma vez:

```sh
npm run contexto -- preparar
```

O comando instala o MemPalace 3.12 numa pasta local, baixa os arquivos públicos do modelo multilíngue EmbeddingGemma e faz uma consulta de teste. A leitura das decisões, a indexação e as consultas rodam offline. Cada cópia do repositório reconstrói o índice a partir dos arquivos versionados.

| Para encontrar | Comando |
| --- | --- |
| Estado atual e pendência principal | `npm run contexto` |
| Resumo de um tema com decisões, arquivos e histórico | `npm run contexto -- retomar vsr` |
| Arquivos da área | `npm run contexto -- area vsr` |
| Trechos em decisões e código | `npm run contexto -- buscar "bronquiolitis"` |
| O que mudou no Git | `npm run contexto -- historico progresso` |
| Trechos pelo sentido com MemPalace | `npm run contexto -- semantica "por que guardamos o maior resultado?"` |

A busca por texto reconhece termos equivalentes em português e espanhol. O índice fica em `.atlas-contexto/`, com Chroma local, e é atualizado na próxima consulta quando os documentos mudam. Se o MemPalace estiver indisponível, a consulta usa a busca por texto. [Documentação do MemPalace](https://mempalaceofficial.com/guide/getting-started)

O comando `npm run contexto -- exportar-mempalace` gera a seleção de documentos que entra no índice: o estado do projeto, o `AGENTS.md` e o registro de decisões. Para continuar depois de mudar de conta, editor ou computador, abra o mesmo repositório e siga as instruções do `AGENTS.md`.

## Editar em dupla

O código e a memória compartilhados estão no [Matraca130/elgamee](https://github.com/Matraca130/elgamee). Abra esse repositório no Codex ou no editor para continuar o projeto. Use uma branch por tarefa e proponha as mudanças por pull request. É possível criar um fork para enviar uma proposta a partir da sua conta.

Se você recebeu o pacote Git do Atlas, rode `git clone atlas-viral.bundle atlas-viral` e abra a pasta `atlas-viral` no editor. O pacote traz o histórico e os arquivos de contexto da versão em que foi criado.

A URL do Atlas é publicada a partir do repositório vinculado ao Site. Se a equipe editar em outro repositório, aplique a revisão combinada no repositório do Site antes de publicar. As configurações da conta e os resultados dos jogadores ficam na hospedagem.

## Jogar pela prévia do GitHub

Depois de ativar o GitHub Pages, use o [link fixo da prévia jogável](https://matraca130.github.io/elgamee/). O progresso nessa prévia fica no navegador.

A branch `gh-pages` guarda o jogo pronto para abrir. O código e as decisões continuam no fluxo de pull requests para `main`. Consulte a [decisão da prévia pública](docs/decisoes/previa-github-pages.md) para ativar o endereço e atualizar a versão jogável.
