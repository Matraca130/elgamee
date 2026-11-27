# Atlas Viral

Jogo de virologia com cursos interativos de influenza e vírus sincicial respiratório. O código da arena e das fichas está em `dist/`. O servidor do site e o progresso por conta estão em `worker/`.

## Rodar e revisar

Com Node.js instalado, execute `npm run dev` e abra a URL exibida. Na prévia local, o avanço fica no navegador. Execute `npm run build` para gerar o Worker que serve o jogo e o progresso por conta no site.

Para continuar em outro chat ou editor, abra o repositório na raiz e consulte as [instruções do projeto](AGENTS.md). O [registro de decisões](docs/decisoes/README.md) explica as escolhas que ainda orientam o código.

## Recuperar contexto

| Para encontrar | Comando |
| --- | --- |
| Estado atual e pendência principal | `npm run contexto` |
| Arquivos da área | `npm run contexto -- area vsr` |
| Trechos em decisões e código | `npm run contexto -- buscar "bronquiolitis"` |
| O que mudou no Git | `npm run contexto -- historico progresso` |
| Trechos pelo sentido com MemPalace | `npm run contexto -- semantica "por que guardamos o maior resultado?"` |

A busca por texto reconhece termos equivalentes em português e espanhol. Para ativar a busca pelo sentido, instale a versão atual do MemPalace com `uv tool install mempalace`. A primeira consulta semântica usa o modelo multilíngue EmbeddingGemma, que pode precisar de um download. O índice fica em `.atlas-contexto/`, com Chroma local, e é atualizado quando os documentos mudam. Quando o MemPalace estiver indisponível, o comando retorna a busca por texto. [Instalação do MemPalace](https://mempalaceofficial.com/guide/getting-started)

O comando `npm run contexto -- exportar-mempalace` gera a seleção de documentos que entra no índice. A memória compartilhada viaja com o código e cada pessoa pode gerar seu índice local.

## Editar em dupla

Quando os dois têm edição no mesmo Site, cada pessoa pode abrir o Atlas em Sites e revisar sua mudança na prévia. Para colaboração em um Git privado, os dois abrem o mesmo repositório e podem usar uma branch por tarefa para revisar as mudanças antes de reunir o código na branch principal.

A URL do Atlas é publicada a partir do repositório vinculado ao Site. Se a equipe editar em outro repositório, aplique a revisão combinada no repositório do Site antes de publicar. As configurações da conta e os resultados dos jogadores ficam na hospedagem.
